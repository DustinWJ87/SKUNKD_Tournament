import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { PrismaClient } from "@/generated/prisma";

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const seatMap = await prisma.seatMap.findUnique({
      where: {
        id: params.id,
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
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

    if (!seatMap) {
      return NextResponse.json(
        { error: "Seat map not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(seatMap);
  } catch (error) {
    console.error("Error fetching seat map:", error);
    return NextResponse.json(
      { error: "Failed to fetch seat map" },
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
        { error: "Unauthorized. Only superadmins can delete seat maps." },
        { status: 401 }
      );
    }

    // Check if seat map exists
    const existingSeatMap = await prisma.seatMap.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: {
            events: true,
          },
        },
      },
    });

    if (!existingSeatMap) {
      return NextResponse.json(
        { error: "Seat map not found" },
        { status: 404 }
      );
    }

    // Check if seat map is being used by any events
    if (existingSeatMap._count.events > 0) {
      return NextResponse.json(
        { error: "Cannot delete seat map that is being used by events. Delete or update the events first." },
        { status: 400 }
      );
    }

    // Delete all seats first (due to foreign key constraints)
    await prisma.seat.deleteMany({
      where: { seatMapId: params.id },
    });

    // Delete the seat map
    await prisma.seatMap.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: "Seat map deleted successfully" });
  } catch (error) {
    console.error("Error deleting seat map:", error);
    return NextResponse.json(
      { error: "Failed to delete seat map" },
      { status: 500 }
    );
  }
}