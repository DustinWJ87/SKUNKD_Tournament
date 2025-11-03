import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = session.user as any
    const userId = user.id

    // Fetch all registrations for the user
    const registrations = await prisma.eventRegistration.findMany({
      where: {
        userId: userId,
      },
      include: {
        event: {
          select: {
            id: true,
            name: true,
            game: true,
            startDate: true,
            endDate: true,
            venue: true,
            isOnline: true,
            status: true,
            thumbnailImage: true,
            entryFee: true,
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
      orderBy: {
        event: {
          startDate: 'asc',
        },
      },
    })

    // Get seat information for each registration
    const registrationsWithSeats = await Promise.all(
      registrations.map(async (reg: any) => {
        const seatReservation = await prisma.seatReservation.findFirst({
          where: {
            userId: userId,
            seat: {
              eventId: reg.eventId,
            },
          },
          include: {
            seat: {
              select: {
                id: true,
                row: true,
                number: true,
                label: true,
                type: true,
              },
            },
          },
        })

        return {
          ...reg,
          seat: seatReservation?.seat || null,
        }
      })
    )

    return NextResponse.json(registrationsWithSeats)
  } catch (error) {
    console.error("Error fetching registrations:", error)
    return NextResponse.json(
      { error: "Failed to fetch registrations" },
      { status: 500 }
    )
  }
}
