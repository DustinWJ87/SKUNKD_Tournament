import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

// PATCH /api/teams/[id]/members/[memberId] - Update member role
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; memberId: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const currentUser = session.user as any
    const currentUserId = currentUser.id
    const teamId = params.id
    const memberId = params.memberId

    const body = await request.json()
    const { role } = body

    if (!role || !["CAPTAIN", "CO_CAPTAIN", "MEMBER"].includes(role)) {
      return NextResponse.json(
        { error: "Invalid role. Must be CAPTAIN, CO_CAPTAIN, or MEMBER" },
        { status: 400 }
      )
    }

    // Check if current user is captain
    const currentMembership = await prisma.teamMember.findFirst({
      where: {
        teamId: teamId,
        userId: currentUserId,
        role: "CAPTAIN",
      },
    })

    if (!currentMembership) {
      return NextResponse.json(
        { error: "Only team captain can change member roles" },
        { status: 403 }
      )
    }

    // Update member role
    const updatedMember = await prisma.teamMember.update({
      where: { id: memberId },
      data: { role: role },
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

    return NextResponse.json(updatedMember)
  } catch (error) {
    console.error("Error updating member role:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update member role" },
      { status: 500 }
    )
  }
}

// DELETE /api/teams/[id]/members/[memberId] - Remove member from team
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; memberId: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const currentUser = session.user as any
    const currentUserId = currentUser.id
    const teamId = params.id
    const memberId = params.memberId

    // Get the member to be removed
    const memberToRemove = await prisma.teamMember.findUnique({
      where: { id: memberId },
      include: {
        user: true,
      },
    })

    if (!memberToRemove) {
      return NextResponse.json(
        { error: "Member not found" },
        { status: 404 }
      )
    }

    // Check if it's the team creator
    const team = await prisma.team.findUnique({
      where: { id: teamId },
    })

    if (team?.creatorId === memberToRemove.userId) {
      return NextResponse.json(
        { error: "Cannot remove team creator from the team" },
        { status: 400 }
      )
    }

    // Check permissions: captain can remove anyone, users can remove themselves
    const currentMembership = await prisma.teamMember.findFirst({
      where: {
        teamId: teamId,
        userId: currentUserId,
      },
    })

    const isCaptain = currentMembership?.role === "CAPTAIN"
    const isRemovingSelf = memberToRemove.userId === currentUserId

    if (!isCaptain && !isRemovingSelf) {
      return NextResponse.json(
        { error: "You don't have permission to remove this member" },
        { status: 403 }
      )
    }

    // Remove member
    await prisma.teamMember.delete({
      where: { id: memberId },
    })

    return NextResponse.json({
      message: "Member removed successfully",
      removedUser: memberToRemove.user.username,
    })
  } catch (error) {
    console.error("Error removing team member:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to remove team member" },
      { status: 500 }
    )
  }
}
