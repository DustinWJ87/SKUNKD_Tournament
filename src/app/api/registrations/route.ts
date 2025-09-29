import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { PrismaClient } from "@/generated/prisma";

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get("eventId");
    const userId = searchParams.get("userId");

    let whereClause: any = {};
    
    if (eventId) {
      whereClause.eventId = eventId;
    }
    
    if (userId) {
      whereClause.userId = userId;
    } else if (session.user.role !== "SUPERADMIN" && session.user.role !== "EVENT_ORGANIZER") {
      // Non-admin users can only see their own registrations
      whereClause.userId = session.user.id;
    }

    const registrations = await prisma.registration.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
        event: {
          select: {
            title: true,
            game: true,
            eventStart: true,
            entryFee: true,
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
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(registrations);
  } catch (error) {
    console.error("Error fetching registrations:", error);
    return NextResponse.json(
      { error: "Failed to fetch registrations" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { eventId, seatId } = body;

    // Check if user is already registered for this event
    const existingRegistration = await prisma.registration.findUnique({
      where: {
        userId_eventId: {
          userId: session.user.id,
          eventId,
        },
      },
    });

    if (existingRegistration) {
      return NextResponse.json(
        { error: "Already registered for this event" },
        { status: 400 }
      );
    }

    // Check if seat is available (if seat is specified)
    if (seatId) {
      const seat = await prisma.seat.findUnique({
        where: { id: seatId },
        include: {
          registrations: true,
        },
      });

      if (!seat || seat.status !== "AVAILABLE" || seat.registrations.length > 0) {
        return NextResponse.json(
          { error: "Seat is not available" },
          { status: 400 }
        );
      }
    }

    const registration = await prisma.registration.create({
      data: {
        userId: session.user.id,
        eventId,
        seatId,
        status: "PENDING",
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
        event: {
          select: {
            title: true,
            game: true,
            eventStart: true,
            entryFee: true,
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
    });

    // Update seat status if seat was selected
    if (seatId) {
      await prisma.seat.update({
        where: { id: seatId },
        data: { status: "RESERVED" },
      });
    }

    return NextResponse.json(registration, { status: 201 });
  } catch (error) {
    console.error("Error creating registration:", error);
    return NextResponse.json(
      { error: "Failed to create registration" },
      { status: 500 }
    );
  }
}