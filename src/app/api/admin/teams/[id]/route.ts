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
    const session = await getServerSession(authOptions);

    if (!session || (session.user?.role !== "SUPERADMIN" && session.user?.role !== "EVENT_ORGANIZER")) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const team = await prisma.team.findUnique({
      where: { id: params.id },
      include: {
        event: {
          select: {
            id: true,
            title: true,
            game: true,
            status: true,
            teamSize: true,
            creatorId: true,
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
    });

    if (!team) {
      return NextResponse.json(
        { error: "Team not found" },
        { status: 404 }
      );
    }

    // Check if user has permission to view this team
    if (session.user.role === "EVENT_ORGANIZER" && team.event.creatorId !== session.user.id) {
      return NextResponse.json(
        { error: "Unauthorized to view this team" },
        { status: 403 }
      );
    }

    return NextResponse.json(team);
  } catch (error) {
    console.error("Error fetching team:", error);
    return NextResponse.json(
      { error: "Failed to fetch team" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user?.role !== "SUPERADMIN") {
      return NextResponse.json(
        { error: "Unauthorized - Only superadmins can delete teams" },
        { status: 401 }
      );
    }

    // Check if team exists and get event info
    const existingTeam = await prisma.team.findUnique({
      where: { id: params.id },
      include: {
        event: {
          select: {
            creatorId: true,
          },
        },
        _count: {
          select: {
            members: true,
          },
        },
      },
    });

    if (!existingTeam) {
      return NextResponse.json(
        { error: "Team not found" },
        { status: 404 }
      );
    }

    // Delete the team (this will cascade delete team members due to schema)
    await prisma.team.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: "Team deleted successfully" });
  } catch (error) {
    console.error("Error deleting team:", error);
    return NextResponse.json(
      { error: "Failed to delete team" },
      { status: 500 }
    );
  }
}