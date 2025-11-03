import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

// POST /api/teams/[id]/members - Add member to team
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const currentUser = session.user as any
    const currentUserId = currentUser.id
    const teamId = params.id

    const body = await request.json()
    const { username, role } = body

    if (!username) {
      return NextResponse.json(
        { error: "Username is required" },
        { status: 400 }
      )
    }

    // Check if current user is captain or co-captain
    const currentMembership = await prisma.teamMember.findFirst({
      where: {
        teamId: teamId,
        userId: currentUserId,
        role: {
          in: ["CAPTAIN", "CO_CAPTAIN"],
        },
      },
    })

    if (!currentMembership) {
      return NextResponse.json(
        { error: "Only team captains can add members" },
        { status: 403 }
      )
    }

    // Find user to add
    const userToAdd = await prisma.user.findFirst({
      where: {
        OR: [
          { username: username },
          { email: username },
        ],
      },
    })

    if (!userToAdd) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      )
    }

    // Check if user is already a member
    const existingMembership = await prisma.teamMember.findFirst({
      where: {
        teamId: teamId,
        userId: userToAdd.id,
      },
    })

    if (existingMembership) {
      return NextResponse.json(
        { error: "User is already a member of this team" },
        { status: 400 }
      )
    }

    // Add user to team
    const newMember = await prisma.teamMember.create({
      data: {
        teamId: teamId,
        userId: userToAdd.id,
        role: role || "MEMBER",
      },
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
    })

    return NextResponse.json(newMember, { status: 201 })
  } catch (error) {
    console.error("Error adding team member:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to add team member" },
      { status: 500 }
    )
  }
}

// GET /api/teams/[id]/members - Get team members
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const teamId = params.id

    const members = await prisma.teamMember.findMany({
      where: { teamId: teamId },
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
      orderBy: [
        { role: 'asc' }, // CAPTAIN first, then CO_CAPTAIN, then MEMBER
        { joinedAt: 'asc' },
      ],
    })

    return NextResponse.json(members)
  } catch (error) {
    console.error("Error fetching team members:", error)
    return NextResponse.json(
      { error: "Failed to fetch team members" },
      { status: 500 }
    )
  }
}
