import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = session.user as any
    
    // Check if user is admin
    if (user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden - Admin access required" }, { status: 403 })
    }

    // Get query parameters for filtering
    const { searchParams } = new URL(request.url)
    const eventId = searchParams.get("eventId")
    const status = searchParams.get("status")
    const paymentStatus = searchParams.get("paymentStatus")
    const checkInStatus = searchParams.get("checkInStatus")

    // Build where clause
    const where: any = {}
    
    if (eventId) {
      where.eventId = eventId
    }
    
    if (status) {
      where.status = status
    }
    
    if (paymentStatus) {
      where.paymentStatus = paymentStatus
    }
    
    if (checkInStatus) {
      where.checkInStatus = checkInStatus
    }

    // Fetch all registrations with filters
    const registrations = await prisma.eventRegistration.findMany({
      where,
      include: {
        event: {
          select: {
            id: true,
            name: true,
            game: true,
            startDate: true,
            endDate: true,
            venue: true,
            isOnline: true,
            status: true,
            entryFee: true,
          },
        },
        user: {
          select: {
            id: true,
            username: true,
            name: true,
            email: true,
            gamerTag: true,
          },
        },
        team: {
          select: {
            id: true,
            name: true,
            tag: true,
          },
        },
      },
      orderBy: {
        registeredAt: 'desc',
      },
    })

    // Get seat information for each registration
    const registrationsWithSeats = await Promise.all(
      registrations.map(async (reg: any) => {
        const seatReservation = await prisma.seatReservation.findFirst({
          where: {
            userId: reg.userId,
            seat: {
              eventId: reg.eventId,
            },
          },
          include: {
            seat: {
              select: {
                id: true,
                row: true,
                number: true,
                label: true,
                type: true,
              },
            },
          },
        })

        return {
          ...reg,
          seat: seatReservation?.seat || null,
        }
      })
    )

    return NextResponse.json(registrationsWithSeats)
  } catch (error) {
    console.error("Error fetching admin registrations:", error)
    return NextResponse.json(
      { error: "Failed to fetch registrations" },
      { status: 500 }
    )
  }
}
