import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

// GET /api/teams - Get user's teams
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = session.user as any
    const userId = user.id

    // Get all teams where user is a member
    const teams = await prisma.team.findMany({
      where: {
        members: {
          some: {
            userId: userId,
          },
        },
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
          orderBy: {
            joinedAt: 'asc',
          },
        },
        _count: {
          select: {
            members: true,
            registrations: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json(teams)
  } catch (error) {
    console.error("Error fetching teams:", error)
    return NextResponse.json(
      { error: "Failed to fetch teams" },
      { status: 500 }
    )
  }
}

// POST /api/teams - Create a new team
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = session.user as any
    const userId = user.id

    const body = await request.json()
    const { name, tag, description, logo } = body

    // Validate required fields
    if (!name || name.trim().length === 0) {
      return NextResponse.json(
        { error: "Team name is required" },
        { status: 400 }
      )
    }

    // Check if team name already exists
    const existingTeam = await prisma.team.findFirst({
      where: {
        name: name.trim(),
      },
    })

    if (existingTeam) {
      return NextResponse.json(
        { error: "A team with this name already exists" },
        { status: 400 }
      )
    }

    // Create team with creator as captain in a transaction
    const team = await prisma.$transaction(async (tx: any) => {
      // Create the team
      const newTeam = await tx.team.create({
        data: {
          name: name.trim(),
          tag: tag?.trim() || null,
          description: description?.trim() || null,
          logo: logo || null,
          creatorId: userId,
        },
        include: {
          creator: {
            select: {
              id: true,
              username: true,
              name: true,
            },
          },
        },
      })

      // Add creator as captain
      await tx.teamMember.create({
        data: {
          teamId: newTeam.id,
          userId: userId,
          role: "CAPTAIN",
        },
      })

      return newTeam
    })

    // Fetch the complete team with members
    const completeTeam = await prisma.team.findUnique({
      where: { id: team.id },
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
        _count: {
          select: {
            members: true,
            registrations: true,
          },
        },
      },
    })

    return NextResponse.json(completeTeam, { status: 201 })
  } catch (error) {
    console.error("Error creating team:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create team" },
      { status: 500 }
    )
  }
}
