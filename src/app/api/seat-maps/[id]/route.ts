import { NextRequest, NextResponse } from "next/server";
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