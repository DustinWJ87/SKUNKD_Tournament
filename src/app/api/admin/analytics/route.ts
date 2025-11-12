import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "ORGANIZER")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const timeRange = searchParams.get("timeRange") || "30" // days
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - parseInt(timeRange))

    // Revenue Analytics - Use Transaction records for proper financial tracking
    const transactions = await prisma.transaction.findMany({
      where: {
        createdAt: {
          gte: startDate,
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    const totalRevenue = transactions
      .filter((t) => t.type === "REGISTRATION_FEE" && t.status === "COMPLETED")
      .reduce((sum, t) => sum + t.amount, 0)

    const totalRefunds = transactions
      .filter((t) => t.type === "REFUND" && t.status === "COMPLETED")
      .reduce((sum, t) => sum + t.amount, 0)

    const netRevenue = totalRevenue - totalRefunds

    // Revenue by day for chart
    const revenueByDay = transactions
      .filter((t) => t.type === "REGISTRATION_FEE" && t.status === "COMPLETED")
      .reduce((acc, t) => {
        const date = t.createdAt.toISOString().split("T")[0]
        acc[date] = (acc[date] || 0) + t.amount
        return acc
      }, {} as Record<string, number>)

    // Registration Analytics
    const registrations = await prisma.eventRegistration.findMany({
      where: {
        registeredAt: {
          gte: startDate,
        },
      },
      include: {
        event: {
          select: {
            name: true,
            game: true,
          },
        },
        user: {
          select: {
            name: true,
            username: true,
          },
        },
      },
    })

    const registrationsByStatus = registrations.reduce((acc, r) => {
      acc[r.status] = (acc[r.status] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const registrationsByDay = registrations.reduce((acc, r) => {
      const date = r.registeredAt.toISOString().split("T")[0]
      acc[date] = (acc[date] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    // Event Analytics
    const events = await prisma.event.findMany({
      where: {
        createdAt: {
          gte: startDate,
        },
      },
      include: {
        _count: {
          select: {
            registrations: true,
          },
        },
      },
    })

    const eventsByStatus = events.reduce((acc, e) => {
      acc[e.status] = (acc[e.status] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const topEvents = events
      .sort((a, b) => b._count.registrations - a._count.registrations)
      .slice(0, 5)
      .map((e) => ({
        id: e.id,
        name: e.name,
        game: e.game,
        registrations: e._count.registrations,
        revenue: registrations
          .filter((r) => r.eventId === e.id && r.paymentStatus === "PAID")
          .reduce((sum, r) => sum + (r.paymentAmount || 0), 0),
      }))

    // User Analytics
    const totalUsers = await prisma.user.count()
    const newUsers = await prisma.user.count({
      where: {
        createdAt: {
          gte: startDate,
        },
      },
    })

    const usersByRole = await prisma.user.groupBy({
      by: ["role"],
      _count: true,
    })

    // Active users (users with recent registrations or team activity)
    const activeUsers = await prisma.user.count({
      where: {
        OR: [
          {
            registrations: {
              some: {
                registeredAt: {
                  gte: startDate,
                },
              },
            },
          },
          {
            teamMemberships: {
              some: {
                joinedAt: {
                  gte: startDate,
                },
              },
            },
          },
        ],
      },
    })

    return NextResponse.json({
      revenue: {
        total: totalRevenue,
        refunds: totalRefunds,
        net: netRevenue,
        byDay: revenueByDay,
        transactions: transactions.length,
      },
      registrations: {
        total: registrations.length,
        byStatus: registrationsByStatus,
        byDay: registrationsByDay,
      },
      events: {
        total: events.length,
        byStatus: eventsByStatus,
        topEvents,
      },
      users: {
        total: totalUsers,
        new: newUsers,
        active: activeUsers,
        byRole: usersByRole.reduce((acc, item) => {
          acc[item.role] = item._count
          return acc
        }, {} as Record<string, number>),
      },
      timeRange: parseInt(timeRange),
    })
  } catch (error) {
    console.error("Analytics error:", error)
    return NextResponse.json(
      { error: "Failed to fetch analytics" },
      { status: 500 }
    )
  }
}
