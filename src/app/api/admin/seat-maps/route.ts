import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { PrismaClient } from "@/generated/prisma";

const prisma = new PrismaClient();

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || (session.user?.role !== "SUPERADMIN" && session.user?.role !== "EVENT_ORGANIZER")) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // SUPERADMIN can see all seat maps, EVENT_ORGANIZER can only see their own
    const whereClause = session.user.role === "SUPERADMIN" 
      ? {} 
      : { creatorId: session.user.id };

    const seatMaps = await prisma.seatMap.findMany({
      where: whereClause,
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
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(seatMaps);
  } catch (error) {
    console.error("Error fetching admin seat maps:", error);
    return NextResponse.json(
      { error: "Failed to fetch seat maps" },
      { status: 500 }
    );
  }
}