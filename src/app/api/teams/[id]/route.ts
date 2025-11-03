import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

// GET /api/teams/[id] - Get team details
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const teamId = params.id

    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: {
        creator: {
          select: {
            id: true,
            username: true,
            name: true,
          },
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                name: true,
                email: true,
                gamerTag: true,
              },
            },
          },
          orderBy: {
            joinedAt: 'asc',
          },
        },
        registrations: {
          include: {
            event: {
              select: {
                id: true,
                name: true,
                game: true,
                startDate: true,
                status: true,
              },
            },
          },
          orderBy: {
            event: {
              startDate: 'desc',
            },
          },
        },
        _count: {
          select: {
            members: true,
            registrations: true,
          },
        },
      },
    })

    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 })
    }

    return NextResponse.json(team)
  } catch (error) {
    console.error("Error fetching team:", error)
    return NextResponse.json(
      { error: "Failed to fetch team" },
      { status: 500 }
    )
  }
}

// PATCH /api/teams/[id] - Update team details
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = session.user as any
    const userId = user.id
    const teamId = params.id

    // Check if user is captain or co-captain
    const membership = await prisma.teamMember.findFirst({
      where: {
        teamId: teamId,
        userId: userId,
        role: {
          in: ["CAPTAIN", "CO_CAPTAIN"],
        },
      },
    })

    if (!membership) {
      return NextResponse.json(
        { error: "Only team captains can update team details" },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { name, tag, description, logo } = body

    const updatedTeam = await prisma.team.update({
      where: { id: teamId },
      data: {
        ...(name && { name: name.trim() }),
        ...(tag !== undefined && { tag: tag?.trim() || null }),
        ...(description !== undefined && { description: description?.trim() || null }),
        ...(logo !== undefined && { logo: logo || null }),
      },
      include: {
        creator: {
          select: {
            id: true,
            username: true,
            name: true,
          },
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    })

    return NextResponse.json(updatedTeam)
  } catch (error) {
    console.error("Error updating team:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update team" },
      { status: 500 }
    )
  }
}

// DELETE /api/teams/[id] - Delete team
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = session.user as any
    const userId = user.id
    const teamId = params.id

    // Check if user is the team creator
    const team = await prisma.team.findUnique({
      where: { id: teamId },
    })

    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 })
    }

    if (team.creatorId !== userId) {
      return NextResponse.json(
        { error: "Only the team creator can delete the team" },
        { status: 403 }
      )
    }

    // Check if team has active registrations
    const activeRegistrations = await prisma.eventRegistration.count({
      where: {
        teamId: teamId,
        status: {
          not: "CANCELLED",
        },
      },
    })

    if (activeRegistrations > 0) {
      return NextResponse.json(
        { error: "Cannot delete team with active event registrations" },
        { status: 400 }
      )
    }

    // Delete team (members will be cascade deleted)
    await prisma.team.delete({
      where: { id: teamId },
    })

    return NextResponse.json({ message: "Team deleted successfully" })
  } catch (error) {
    console.error("Error deleting team:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to delete team" },
      { status: 500 }
    )
  }
}
