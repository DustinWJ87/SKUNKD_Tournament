import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

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
    const registrationId = params.id
    const body = await request.json()
    const { status, paymentStatus, checkInStatus } = body

    // Check if user is admin
    if (user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden - Admin access required" }, { status: 403 })
    }

    // Build update data
    const updateData: any = {}
    
    if (status) updateData.status = status
    if (paymentStatus) updateData.paymentStatus = paymentStatus
    if (checkInStatus) updateData.checkInStatus = checkInStatus

    // Update the registration
    const updatedRegistration = await prisma.eventRegistration.update({
      where: { id: registrationId },
      data: updateData,
      include: {
        event: {
          select: {
            id: true,
            name: true,
            game: true,
            startDate: true,
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

    return NextResponse.json(updatedRegistration)
  } catch (error) {
    console.error("Error updating registration:", error)
    return NextResponse.json(
      { error: "Failed to update registration" },
      { status: 500 }
    )
  }
}

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
    const registrationId = params.id

    // Get the registration to verify ownership and check event status
    const registration = await prisma.eventRegistration.findUnique({
      where: { id: registrationId },
      include: {
        event: {
          select: {
            id: true,
            name: true,
            startDate: true,
            status: true,
          },
        },
      },
    })

    if (!registration) {
      return NextResponse.json(
        { error: "Registration not found" },
        { status: 404 }
      )
    }

    // Verify the registration belongs to the user
    if (registration.userId !== userId) {
      return NextResponse.json(
        { error: "You can only cancel your own registrations" },
        { status: 403 }
      )
    }

    // Check if registration is already cancelled
    if (registration.status === "CANCELLED") {
      return NextResponse.json(
        { error: "Registration is already cancelled" },
        { status: 400 }
      )
    }

    // Check if event has already started or completed
    const now = new Date()
    const eventStart = new Date(registration.event.startDate)
    
    if (eventStart < now) {
      return NextResponse.json(
        { error: "Cannot cancel registration for an event that has already started" },
        { status: 400 }
      )
    }

    // Check if event is in progress or completed
    if (registration.event.status === "IN_PROGRESS" || registration.event.status === "COMPLETED") {
      return NextResponse.json(
        { error: "Cannot cancel registration for this event" },
        { status: 400 }
      )
    }

    // Cancel registration and release seat in a transaction
    await prisma.$transaction(async (tx: any) => {
      // Update registration status to CANCELLED
      await tx.eventRegistration.update({
        where: { id: registrationId },
        data: {
          status: "CANCELLED",
        },
      })

      // Delete seat reservation if it exists
      const seatReservation = await tx.seatReservation.findFirst({
        where: {
          userId: userId,
          seat: {
            eventId: registration.event.id,
          },
        },
      })

      if (seatReservation) {
        await tx.seatReservation.delete({
          where: { id: seatReservation.id },
        })
      }
    })

    return NextResponse.json({
      message: "Registration cancelled successfully",
      registrationId: registrationId,
    })
  } catch (error) {
    console.error("Error cancelling registration:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to cancel registration" },
      { status: 500 }
    )
  }
}
