import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

// GET /api/profile/[userId] - Get user profile
export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const userId = params.userId
    const session = await getServerSession(authOptions)

    // Get user profile
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        name: true,
        email: session?.user && (session.user as any).id === userId ? true : false,
        gamerTag: true,
        bio: true,
        image: true,
        role: true,
        createdAt: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Get user's registrations with event details
    const registrations = await prisma.eventRegistration.findMany({
      where: {
        userId: userId,
        status: {
          not: "CANCELLED",
        },
      },
      include: {
        event: {
          select: {
            id: true,
            name: true,
            game: true,
            startDate: true,
            status: true,
            thumbnailImage: true,
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
        event: {
          startDate: 'desc',
        },
      },
    })

    // Get user's teams
    const teams = await prisma.team.findMany({
      where: {
        members: {
          some: {
            userId: userId,
          },
        },
      },
      include: {
        members: {
          where: {
            userId: userId,
          },
          select: {
            role: true,
          },
        },
        _count: {
          select: {
            members: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    // Calculate stats
    const stats = {
      totalEvents: registrations.length,
      upcomingEvents: registrations.filter(
        (r: any) => new Date(r.event.startDate) > new Date() && r.event.status !== 'COMPLETED'
      ).length,
      completedEvents: registrations.filter(
        (r: any) => r.event.status === 'COMPLETED'
      ).length,
      teamsJoined: teams.length,
      checkedInEvents: registrations.filter(
        (r: any) => r.checkInStatus === 'CHECKED_IN'
      ).length,
    }

    // Separate upcoming and past events
    const upcomingEvents = registrations.filter(
      (r: any) => new Date(r.event.startDate) > new Date() && r.event.status !== 'COMPLETED'
    )

    const pastEvents = registrations.filter(
      (r: any) => new Date(r.event.startDate) <= new Date() || r.event.status === 'COMPLETED'
    )

    return NextResponse.json({
      user,
      stats,
      upcomingEvents,
      pastEvents,
      teams: teams.map((team: any) => ({
        ...team,
        userRole: team.members[0]?.role,
        members: undefined,
      })),
    })
  } catch (error) {
    console.error("Error fetching user profile:", error)
    return NextResponse.json(
      { error: "Failed to fetch user profile" },
      { status: 500 }
    )
  }
}

// PATCH /api/profile/[userId] - Update user profile
export async function PATCH(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const currentUser = session.user as any
    const userId = params.userId

    // Only allow users to update their own profile
    if (currentUser.id !== userId) {
      return NextResponse.json(
        { error: "You can only update your own profile" },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { name, gamerTag, bio, image } = body

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(name !== undefined && { name }),
        ...(gamerTag !== undefined && { gamerTag }),
        ...(bio !== undefined && { bio }),
        ...(image !== undefined && { image }),
      },
      select: {
        id: true,
        username: true,
        name: true,
        email: true,
        gamerTag: true,
        bio: true,
        image: true,
        role: true,
        createdAt: true,
      },
    })

    return NextResponse.json(updatedUser)
  } catch (error) {
    console.error("Error updating user profile:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update profile" },
      { status: 500 }
    )
  }
}
