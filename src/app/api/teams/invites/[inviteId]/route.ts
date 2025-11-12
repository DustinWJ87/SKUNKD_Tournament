import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { createNotification } from "@/lib/notifications"

// GET /api/teams/invites/[inviteId] - Get invite details
export async function GET(
  request: NextRequest,
  { params }: { params: { inviteId: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const inviteId = params.inviteId

    const invite = await prisma.teamInvite.findUnique({
      where: { id: inviteId },
      include: {
        team: {
          select: {
            id: true,
            name: true,
            tag: true,
            description: true,
            logo: true,
            _count: {
              select: { members: true },
            },
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

    if (!invite) {
      return NextResponse.json({ error: "Invite not found" }, { status: 404 })
    }

    // Check if user can view this invite
    const currentUser = session.user as any
    if (invite.userId !== currentUser.id) {
      return NextResponse.json(
        { error: "You don't have permission to view this invite" },
        { status: 403 }
      )
    }

    return NextResponse.json(invite)
  } catch (error) {
    console.error("Error fetching invite:", error)
    return NextResponse.json(
      { error: "Failed to fetch invite" },
      { status: 500 }
    )
  }
}

// PATCH /api/teams/invites/[inviteId] - Accept or decline invite
export async function PATCH(
  request: NextRequest,
  { params }: { params: { inviteId: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const currentUser = session.user as any
    const inviteId = params.inviteId

    const body = await request.json()
    const { action } = body // "accept" or "decline"

    if (!action || !["accept", "decline"].includes(action)) {
      return NextResponse.json(
        { error: "Invalid action. Must be 'accept' or 'decline'" },
        { status: 400 }
      )
    }

    // Get invite
    const invite = await prisma.teamInvite.findUnique({
      where: { id: inviteId },
      include: {
        team: {
          include: {
            _count: {
              select: { members: true },
            },
          },
        },
      },
    })

    if (!invite) {
      return NextResponse.json({ error: "Invite not found" }, { status: 404 })
    }

    // Check if user owns this invite
    if (invite.userId !== currentUser.id) {
      return NextResponse.json(
        { error: "You don't have permission to respond to this invite" },
        { status: 403 }
      )
    }

    // Check if invite is still pending
    if (invite.status !== "PENDING") {
      return NextResponse.json(
        { error: `Invite has already been ${invite.status.toLowerCase()}` },
        { status: 400 }
      )
    }

    // Check if invite is expired
    if (new Date() > invite.expiresAt) {
      await prisma.teamInvite.update({
        where: { id: inviteId },
        data: { status: "EXPIRED" },
      })
      return NextResponse.json(
        { error: "Invite has expired" },
        { status: 400 }
      )
    }

    if (action === "accept") {
      // Check if team is full
      if (invite.team._count.members >= invite.team.maxMembers) {
        return NextResponse.json(
          { error: "Team is full" },
          { status: 400 }
        )
      }

      // Check if user is already a member
      const existingMember = await prisma.teamMember.findFirst({
        where: {
          teamId: invite.teamId,
          userId: currentUser.id,
        },
      })

      if (existingMember) {
        return NextResponse.json(
          { error: "You are already a member of this team" },
          { status: 400 }
        )
      }

      // Accept invite - add user to team
      const result = await prisma.$transaction(async (tx: any) => {
        // Update invite status
        const updatedInvite = await tx.teamInvite.update({
          where: { id: inviteId },
          data: {
            status: "ACCEPTED",
            respondedAt: new Date(),
          },
        })

        // Add user to team
        const newMember = await tx.teamMember.create({
          data: {
            teamId: invite.teamId,
            userId: currentUser.id,
            role: "MEMBER",
          },
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
        })

        return { invite: updatedInvite, member: newMember }
      })

      // Notify team captain
      const captainMember = await prisma.teamMember.findFirst({
        where: {
          teamId: invite.teamId,
          role: "CAPTAIN",
        },
      })

      if (captainMember) {
        await createNotification({
          userId: captainMember.userId,
          type: "TEAM_ACCEPTED",
          title: `${currentUser.username} joined ${invite.team.name}`,
          message: `${currentUser.username} has accepted your team invitation`,
          link: `/teams/${invite.teamId}`,
          teamId: invite.teamId,
        })
      }

      return NextResponse.json({
        message: "Invite accepted successfully",
        member: result.member,
      })
    } else {
      // Decline invite
      const updatedInvite = await prisma.teamInvite.update({
        where: { id: inviteId },
        data: {
          status: "DECLINED",
          respondedAt: new Date(),
        },
      })

      return NextResponse.json({
        message: "Invite declined",
        invite: updatedInvite,
      })
    }
  } catch (error) {
    console.error("Error responding to invite:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to respond to invite" },
      { status: 500 }
    )
  }
}

// DELETE /api/teams/invites/[inviteId] - Cancel invite (by team captain)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { inviteId: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const currentUser = session.user as any
    const inviteId = params.inviteId

    const invite = await prisma.teamInvite.findUnique({
      where: { id: inviteId },
      include: {
        team: true,
      },
    })

    if (!invite) {
      return NextResponse.json({ error: "Invite not found" }, { status: 404 })
    }

    // Check if user is captain or co-captain of the team
    const membership = await prisma.teamMember.findFirst({
      where: {
        teamId: invite.teamId,
        userId: currentUser.id,
        role: {
          in: ["CAPTAIN", "CO_CAPTAIN"],
        },
      },
    })

    if (!membership) {
      return NextResponse.json(
        { error: "Only team captains can cancel invites" },
        { status: 403 }
      )
    }

    // Cancel invite
    await prisma.teamInvite.update({
      where: { id: inviteId },
      data: {
        status: "CANCELLED",
      },
    })

    return NextResponse.json({ message: "Invite cancelled successfully" })
  } catch (error) {
    console.error("Error cancelling invite:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to cancel invite" },
      { status: 500 }
    )
  }
}
