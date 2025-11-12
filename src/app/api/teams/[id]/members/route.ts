import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { createNotification } from "@/lib/notifications"

// POST /api/teams/[id]/members - Send team invite
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
    const { username, email, message } = body

    if (!username && !email) {
      return NextResponse.json(
        { error: "Username or email is required" },
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
        { error: "Only team captains can invite members" },
        { status: 403 }
      )
    }

    // Find user to invite
    const userToInvite = await prisma.user.findFirst({
      where: {
        OR: [
          ...(username ? [{ username: username }] : []),
          ...(email ? [{ email: email }] : []),
        ],
      },
    })

    if (!userToInvite) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      )
    }

    // Check if user is already a member
    const existingMembership = await prisma.teamMember.findFirst({
      where: {
        teamId: teamId,
        userId: userToInvite.id,
      },
    })

    if (existingMembership) {
      return NextResponse.json(
        { error: "User is already a member of this team" },
        { status: 400 }
      )
    }

    // Check if invite already exists
    const existingInvite = await prisma.teamInvite.findFirst({
      where: {
        teamId: teamId,
        userId: userToInvite.id,
        status: "PENDING",
      },
    })

    if (existingInvite) {
      return NextResponse.json(
        { error: "User already has a pending invite" },
        { status: 400 }
      )
    }

    // Get team info
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: {
        _count: {
          select: { members: true },
        },
      },
    })

    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 })
    }

    // Check if team is full
    if (team._count.members >= team.maxMembers) {
      return NextResponse.json(
        { error: "Team is full" },
        { status: 400 }
      )
    }

    // Create invite (expires in 7 days)
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7)

    const invite = await prisma.teamInvite.create({
      data: {
        teamId: teamId,
        userId: userToInvite.id,
        message: message?.trim() || null,
        expiresAt: expiresAt,
      },
      include: {
        team: {
          select: {
            id: true,
            name: true,
            tag: true,
          },
        },
        user: {
          select: {
            id: true,
            username: true,
            name: true,
            email: true,
          },
        },
      },
    })

    // Create notification for invited user
    await createNotification({
      userId: userToInvite.id,
      type: "TEAM_INVITATION",
      title: `Team Invitation from ${team.name}`,
      message: message || `You've been invited to join ${team.name}`,
      link: `/teams/invites/${invite.id}`,
      teamId: teamId,
    })

    return NextResponse.json(invite, { status: 201 })
  } catch (error) {
    console.error("Error creating team invite:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create invite" },
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
