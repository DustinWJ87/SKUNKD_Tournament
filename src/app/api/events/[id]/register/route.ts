import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const eventId = params.id
    const body = await request.json()
    const { seatId, teamId } = body

    // Get the user from session
    const user = session.user as any
    const userId = user.id

    // Check if event exists and is accepting registrations
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        _count: {
          select: { registrations: true },
        },
      },
    })

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    if (event.status !== "REGISTRATION_OPEN") {
      return NextResponse.json(
        { error: "Registration is not open for this event" },
        { status: 400 }
      )
    }

    // Check if event is full
    if (event._count.registrations >= event.maxParticipants) {
      return NextResponse.json(
        { error: "Event is full" },
        { status: 400 }
      )
    }

    // Check if user has any existing registration (including cancelled)
    const existingRegistration = await prisma.eventRegistration.findFirst({
      where: {
        eventId: eventId,
        userId: userId,
      },
    })

    // If there's an active (non-cancelled) registration, prevent duplicate
    if (existingRegistration && existingRegistration.status !== "CANCELLED") {
      return NextResponse.json(
        { error: "You are already registered for this event" },
        { status: 400 }
      )
    }

    // If seat is specified, check if it's available
    if (seatId) {
      const seat = await prisma.seat.findUnique({
        where: { id: seatId },
        include: { reservations: true },
      })

      if (!seat) {
        return NextResponse.json({ error: "Seat not found" }, { status: 404 })
      }

      if (seat.eventId !== eventId) {
        return NextResponse.json(
          { error: "Seat does not belong to this event" },
          { status: 400 }
        )
      }

      if (seat.reservations && seat.reservations.length > 0) {
        return NextResponse.json(
          { error: "Seat is already reserved" },
          { status: 400 }
        )
      }
    }

    // Create or update registration and seat reservation in a transaction
    const result = await prisma.$transaction(async (tx: any) => {
      let registration;
      
      // If there's a cancelled registration, update it instead of creating new
      if (existingRegistration && existingRegistration.status === "CANCELLED") {
        registration = await tx.eventRegistration.update({
          where: { id: existingRegistration.id },
          data: {
            teamId: teamId || null,
            status: "APPROVED",
            paymentStatus: event.entryFee > 0 ? "PENDING" : "PAID",
            paymentAmount: event.entryFee,
            registeredAt: new Date(), // Update registration timestamp
          },
          include: {
            event: {
              select: {
                name: true,
                game: true,
                startDate: true,
              },
            },
          },
        })
      } else {
        // Create new event registration
        registration = await tx.eventRegistration.create({
          data: {
            eventId: eventId,
            userId: userId,
            teamId: teamId || null,
            status: "APPROVED",
            paymentStatus: event.entryFee > 0 ? "PENDING" : "PAID",
            paymentAmount: event.entryFee,
          },
          include: {
            event: {
              select: {
                name: true,
                game: true,
                startDate: true,
              },
            },
          },
        })
      }

      // Create seat reservation if seat was selected
      if (seatId) {
        await tx.seatReservation.create({
          data: {
            seatId: seatId,
            userId: userId,
          },
        })
      }

      return registration
    })

    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    console.error("Error creating registration:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create registration" },
      { status: 500 }
    )
  }
}
