import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const event = await prisma.event.findUnique({
      where: {
        id: params.id,
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            username: true,
            image: true,
          },
        },
        registrations: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                username: true,
                gamerTag: true,
                image: true,
              },
            },
            team: {
              select: {
                id: true,
                name: true,
                tag: true,
              },
            },
          },
        },
        seats: {
          include: {
            reservations: {
              include: {
                user: {
                  select: {
                    id: true,
                    username: true,
                    gamerTag: true,
                  },
                },
              },
            },
          },
          orderBy: [{ row: "asc" }, { number: "asc" }],
        },
        _count: {
          select: {
            registrations: true,
            seats: true,
          },
        },
      },
    })

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    return NextResponse.json({ event })
  } catch (error) {
    console.error("Error fetching event:", error)
    return NextResponse.json({ error: "Failed to fetch event" }, { status: 500 })
  }
}
