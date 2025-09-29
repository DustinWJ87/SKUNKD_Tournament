import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { PrismaClient } from "@/generated/prisma";

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || (session.user?.role !== "SUPERADMIN" && session.user?.role !== "EVENT_ORGANIZER")) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get("eventId");

    // Build where clause based on user role and filters
    let whereClause: any = {};

    if (eventId) {
      whereClause.eventId = eventId;
    }

    // If user is EVENT_ORGANIZER, only show teams from their events
    if (session.user.role === "EVENT_ORGANIZER") {
      whereClause.event = {
        creatorId: session.user.id
      };
    }

    const teams = await prisma.team.findMany({
      where: whereClause,
      include: {
        event: {
          select: {
            id: true,
            title: true,
            game: true,
            status: true,
          },
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
          orderBy: {
            createdAt: "asc",
          },
        },
        _count: {
          select: {
            members: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(teams);
  } catch (error) {
    console.error("Error fetching teams:", error);
    return NextResponse.json(
      { error: "Failed to fetch teams" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || (session.user?.role !== "SUPERADMIN" && session.user?.role !== "EVENT_ORGANIZER")) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { name, description, eventId } = body;

    // Verify the event exists and user has permission
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: { id: true, creatorId: true, maxTeams: true, _count: { select: { teams: true } } },
    });

    if (!event) {
      return NextResponse.json(
        { error: "Event not found" },
        { status: 404 }
      );
    }

    // Check if user has permission to create teams for this event
    if (session.user.role === "EVENT_ORGANIZER" && event.creatorId !== session.user.id) {
      return NextResponse.json(
        { error: "Unauthorized to create teams for this event" },
        { status: 403 }
      );
    }

    // Check if event has reached max teams
    if (event.maxTeams && event._count.teams >= event.maxTeams) {
      return NextResponse.json(
        { error: "Event has reached maximum number of teams" },
        { status: 400 }
      );
    }

    const team = await prisma.team.create({
      data: {
        name,
        description,
        eventId,
      },
      include: {
        event: {
          select: {
            id: true,
            title: true,
            game: true,
            status: true,
          },
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        _count: {
          select: {
            members: true,
          },
        },
      },
    });

    return NextResponse.json(team);
  } catch (error) {
    console.error("Error creating team:", error);
    return NextResponse.json(
      { error: "Failed to create team" },
      { status: 500 }
    );
  }
}