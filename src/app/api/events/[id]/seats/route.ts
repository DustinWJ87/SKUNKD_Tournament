import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const eventId = params.id

    // Fetch all seats for the event with their reservation status
    const seats = await prisma.seat.findMany({
      where: {
        eventId: eventId,
      },
      include: {
        reservations: {
          select: {
            id: true,
            userId: true,
            user: {
              select: {
                username: true,
                gamerTag: true,
              },
            },
          },
        },
      },
      orderBy: [
        { row: 'asc' },
        { number: 'asc' },
      ],
    })

    // Transform seats to include status
    const seatsWithStatus = seats.map((seat: any) => ({
      id: seat.id,
      label: seat.label,
      number: seat.number,
      row: seat.row,
      type: seat.type,
      status: seat.reservations && seat.reservations.length > 0 ? 'reserved' : 'available',
      reservedBy: seat.reservations && seat.reservations.length > 0 ? {
        username: seat.reservations[0].user.username,
        gamerTag: seat.reservations[0].user.gamerTag,
      } : null,
    }))

    return NextResponse.json({ seats: seatsWithStatus })
  } catch (error) {
    console.error("Error fetching seats:", error)
    return NextResponse.json(
      { error: "Failed to fetch seats" },
      { status: 500 }
    )
  }
}
