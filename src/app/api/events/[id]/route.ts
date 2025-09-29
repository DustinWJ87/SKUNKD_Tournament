import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { PrismaClient } from "@/generated/prisma";

const prisma = new PrismaClient();

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const event = await prisma.event.findUnique({
      where: { id: params.id },
      include: {
        creator: {
          select: {
            name: true,
            email: true,
          },
        },
        seatMap: {
          select: {
            name: true,
            width: true,
            height: true,
          },
        },
        registrations: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
              },
            },
            seat: {
              select: {
                label: true,
                row: true,
                column: true,
                type: true,
              },
            },
          },
        },
        teams: {
          include: {
            members: {
              select: {
                id: true,
                status: true,
              },
            },
          },
        },
        _count: {
          select: {
            registrations: true,
            teams: true,
          },
        },
      },
    });

    if (!event) {
      return NextResponse.json(
        { error: "Event not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(event);
  } catch (error) {
    console.error("Error fetching event:", error);
    return NextResponse.json(
      { error: "Failed to fetch event" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();

    const event = await prisma.event.update({
      where: { id: params.id },
      data: body,
      include: {
        creator: {
          select: {
            name: true,
            email: true,
          },
        },
        seatMap: {
          select: {
            name: true,
            width: true,
            height: true,
          },
        },
      },
    });

    return NextResponse.json(event);
  } catch (error) {
    console.error("Error updating event:", error);
    return NextResponse.json(
      { error: "Failed to update event" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check if user is authenticated and has SUPERADMIN role
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "SUPERADMIN") {
      return NextResponse.json(
        { error: "Unauthorized. Only superadmins can delete events." },
        { status: 401 }
      );
    }

    // Check if event exists
    const existingEvent = await prisma.event.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: {
            registrations: true,
            teams: true,
          },
        },
      },
    });

    if (!existingEvent) {
      return NextResponse.json(
        { error: "Event not found" },
        { status: 404 }
      );
    }

    // Check if event has registrations or teams
    if (existingEvent._count.registrations > 0 || existingEvent._count.teams > 0) {
      return NextResponse.json(
        { error: "Cannot delete event with existing registrations or teams. Cancel the event instead." },
        { status: 400 }
      );
    }

    // Delete the event
    await prisma.event.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: "Event deleted successfully" });
  } catch (error) {
    console.error("Error deleting event:", error);
    return NextResponse.json(
      { error: "Failed to delete event" },
      { status: 500 }
    );
  }
}