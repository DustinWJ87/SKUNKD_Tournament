import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { Prisma } from "@prisma/client"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get("status")
    const limit = parseInt(searchParams.get("limit") || "100")
    const page = parseInt(searchParams.get("page") || "1")
    const showAll = searchParams.get("all") === "true"

    const where: any = {}

    if (status) {
      where.status = status
    } else if (!showAll) {
      // By default, show only published events for public
      where.status = {
        in: ["REGISTRATION_OPEN", "REGISTRATION_CLOSED", "IN_PROGRESS"],
      }
    }
    // If showAll is true, no status filter is applied (for admin)

    const [events, total] = await Promise.all([
      prisma.event.findMany({
        where,
        include: {
          creator: {
            select: {
              id: true,
              name: true,
              username: true,
            },
          },
          _count: {
            select: {
              registrations: true,
              seats: true,
            },
          },
        },
        orderBy: {
          startDate: "asc",
        },
        take: limit,
        skip: (page - 1) * limit,
      }),
      prisma.event.count({ where }),
    ])

    return NextResponse.json({
      events,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error("Error fetching events:", error)
    return NextResponse.json({ error: "Failed to fetch events" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = session.user as any
    if (user.role !== "ADMIN" && user.role !== "ORGANIZER") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    const { seatConfig, ...eventData } = body

    // Create event and seats in a transaction
    const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Create the event
      const event = await tx.event.create({
        data: {
          ...eventData,
          creatorId: user.id,
        },
        include: {
          creator: {
            select: {
              id: true,
              name: true,
              username: true,
            },
          },
        },
      })

      // Generate seats if configuration is provided
      if (seatConfig && seatConfig.generateSeats) {
        const seats = []
        const { totalSeats, seatsPerRow, vipSeats } = seatConfig
        
        for (let i = 1; i <= totalSeats; i++) {
          const rowIndex = Math.floor((i - 1) / seatsPerRow)
          const seatInRow = ((i - 1) % seatsPerRow) + 1
          const rowLetter = String.fromCharCode(65 + rowIndex) // A, B, C, etc.
          const seatType = i <= vipSeats ? 'VIP' : 'STANDARD'
          
          seats.push({
            eventId: event.id,
            label: `${rowLetter}${seatInRow}`,
            number: i,
            row: rowLetter,
            type: seatType,
          })
        }

        // Batch create all seats
        await tx.seat.createMany({
          data: seats,
        })
      }

      return event
    })

    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    console.error("Error creating event:", error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : "Failed to create event" 
    }, { status: 500 })
  }
}
