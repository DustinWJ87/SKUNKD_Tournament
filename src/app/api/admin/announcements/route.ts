import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { createAuditLog, getRequestInfo } from "@/lib/audit"
import { createBulkNotifications } from "@/lib/notifications"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const activeOnly = searchParams.get("activeOnly") !== "false"
    const eventId = searchParams.get("eventId")

    const where: Record<string, unknown> = {}

    if (activeOnly) {
      const now = new Date()
      where.isActive = true
      where.startDate = { lte: now }
      where.OR = [{ endDate: null }, { endDate: { gte: now } }]
    }

    if (eventId) {
      where.eventId = eventId
    }

    const announcements = await prisma.announcement.findMany({
      where,
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            username: true,
          },
        },
      },
      orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
    })

    return NextResponse.json({ announcements })
  } catch (error) {
    console.error("Announcements error:", error)
    return NextResponse.json(
      { error: "Failed to fetch announcements" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "ORGANIZER")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { title, content, priority, targetAudience, eventId, endDate, sendNotification } = body

    const announcement = await prisma.announcement.create({
      data: {
        title,
        content,
        priority: priority || "NORMAL",
        targetAudience: targetAudience || "ALL_USERS",
        eventId,
        endDate: endDate ? new Date(endDate) : null,
        creatorId: session.user.id,
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            username: true,
          },
        },
      },
    })

    // Create audit log
    const { ipAddress, userAgent } = getRequestInfo(request)
    await createAuditLog({
      action: "SYSTEM_ERROR", // We'll add ANNOUNCEMENT_CREATED to the enum later
      entityType: "Announcement",
      entityId: announcement.id,
      userId: session.user.id,
      userName: session.user.name || session.user.username,
      userRole: session.user.role,
      metadata: {
        title: announcement.title,
        targetAudience: announcement.targetAudience,
        priority: announcement.priority,
      },
      ipAddress,
      userAgent,
    })

    // Send notifications if requested
    if (sendNotification) {
      let userIds: string[] = []

      if (targetAudience === "ALL_USERS") {
        const users = await prisma.user.findMany({ select: { id: true } })
        userIds = users.map((u) => u.id)
      } else if (targetAudience === "EVENT_PARTICIPANTS" && eventId) {
        const registrations = await prisma.eventRegistration.findMany({
          where: { eventId, status: "APPROVED" },
          select: { userId: true },
        })
        userIds = registrations.map((r) => r.userId)
      } else if (targetAudience === "REGISTERED_USERS") {
        const users = await prisma.user.findMany({
          where: {
            registrations: {
              some: {},
            },
          },
          select: { id: true },
        })
        userIds = users.map((u) => u.id)
      }

      if (userIds.length > 0) {
        await createBulkNotifications(userIds, {
          type: "ANNOUNCEMENT",
          title: `New Announcement: ${title}`,
          message: content.substring(0, 200), // Truncate for notification
          link: "/announcements",
        })
      }
    }

    return NextResponse.json(announcement, { status: 201 })
  } catch (error) {
    console.error("Create announcement error:", error)
    return NextResponse.json(
      { error: "Failed to create announcement" },
      { status: 500 }
    )
  }
}
