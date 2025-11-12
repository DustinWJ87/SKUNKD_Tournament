import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { createAuditLog, getRequestInfo } from "@/lib/audit"

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
    const targetUserId = params.id
    
    // Check if user is admin
    if (user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden - Admin access required" }, { status: 403 })
    }

    // Can't modify own role
    if (user.id === targetUserId) {
      return NextResponse.json({ error: "Cannot modify your own role" }, { status: 400 })
    }

    const body = await request.json()
    const { role } = body

    if (!role || !['PLAYER', 'ORGANIZER', 'ADMIN'].includes(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 })
    }

    // Get current user data for audit log
    const currentUser = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: { role: true, name: true },
    })

    if (!currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Update user role
    const updatedUser = await prisma.user.update({
      where: { id: targetUserId },
      data: { role },
      select: {
        id: true,
        username: true,
        name: true,
        email: true,
        role: true,
      },
    })

    // Create audit log
    const { ipAddress, userAgent } = getRequestInfo(request)
    await createAuditLog({
      action: "USER_ROLE_CHANGED",
      entityType: "User",
      entityId: targetUserId,
      userId: user.id,
      userName: user.name || user.username,
      userRole: user.role,
      changes: {
        role: {
          from: currentUser.role,
          to: role,
        },
      },
      metadata: {
        targetUserName: currentUser.name,
      },
      ipAddress,
      userAgent,
    })

    return NextResponse.json(updatedUser)
  } catch (error) {
    console.error("Error updating user role:", error)
    return NextResponse.json(
      { error: "Failed to update user role" },
      { status: 500 }
    )
  }
}
