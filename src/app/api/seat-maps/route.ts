import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { PrismaClient } from "@/generated/prisma";

const prisma = new PrismaClient();

export async function GET() {
  try {
    const seatMaps = await prisma.seatMap.findMany({
      include: {
        seats: {
          orderBy: [
            { row: "asc" },
            { column: "asc" },
          ],
        },
        _count: {
          select: {
            events: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(seatMaps);
  } catch (error) {
    console.error("Error fetching seat maps:", error);
    return NextResponse.json(
      { error: "Failed to fetch seat maps" },
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
    const { name, description, width, height, seats } = body;

    const seatMap = await prisma.seatMap.create({
      data: {
        name,
        description,
        width,
        height,
        creatorId: session.user.id,
        seats: {
          create: seats.map((seat: any) => ({
            row: seat.row,
            column: seat.column,
            label: seat.label,
            type: seat.type,
            status: seat.status,
          })),
        },
      },
      include: {
        seats: {
          orderBy: [
            { row: "asc" },
            { column: "asc" },
          ],
        },
        _count: {
          select: {
            events: true,
          },
        },
      },
    });

    return NextResponse.json(seatMap);
  } catch (error) {
    console.error("Error creating seat map:", error);
    return NextResponse.json(
      { error: "Failed to create seat map" },
      { status: 500 }
    );
  }
}