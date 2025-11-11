import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/brackets/[id] - Get a specific bracket
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const bracketId = params.id

    const bracket = await prisma.bracket.findUnique({
      where: { id: bracketId },
      include: {
        event: {
          select: {
            id: true,
            name: true,
            game: true,
            status: true,
          },
        },
        matches: {
          include: {
            participant1: true,
            participant2: true,
            winner: true,
          },
          orderBy: [{ round: 'asc' }, { matchNumber: 'asc' }],
        },
        participants: {
          orderBy: { seed: 'asc' },
        },
      },
    })

    if (!bracket) {
      return NextResponse.json({ error: 'Bracket not found' }, { status: 404 })
    }

    return NextResponse.json({ bracket })
  } catch (error) {
    console.error('Error fetching bracket:', error)
    return NextResponse.json(
      { error: 'Failed to fetch bracket' },
      { status: 500 }
    )
  }
}

// PATCH /api/brackets/[id] - Update bracket status
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = session.user as any

    if (user.role !== 'ADMIN' && user.role !== 'ORGANIZER') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const bracketId = params.id
    const body = await request.json()
    const { status, currentRound } = body

    const updateData: any = {}

    if (status) {
      updateData.status = status
      
      if (status === 'IN_PROGRESS' && !updateData.startedAt) {
        updateData.startedAt = new Date()
      }
      
      if (status === 'COMPLETED' && !updateData.completedAt) {
        updateData.completedAt = new Date()
      }
    }

    if (currentRound) {
      updateData.currentRound = currentRound
    }

    const bracket = await prisma.bracket.update({
      where: { id: bracketId },
      data: updateData,
      include: {
        event: {
          select: {
            id: true,
            name: true,
            game: true,
          },
        },
        matches: {
          include: {
            participant1: true,
            participant2: true,
            winner: true,
          },
          orderBy: [{ round: 'asc' }, { matchNumber: 'asc' }],
        },
        participants: {
          orderBy: { seed: 'asc' },
        },
      },
    })

    return NextResponse.json({ bracket })
  } catch (error) {
    console.error('Error updating bracket:', error)
    return NextResponse.json(
      { error: 'Failed to update bracket' },
      { status: 500 }
    )
  }
}

// DELETE /api/brackets/[id] - Delete a bracket
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = session.user as any

    if (user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const bracketId = params.id

    await prisma.bracket.delete({
      where: { id: bracketId },
    })

    return NextResponse.json({ message: 'Bracket deleted successfully' })
  } catch (error) {
    console.error('Error deleting bracket:', error)
    return NextResponse.json(
      { error: 'Failed to delete bracket' },
      { status: 500 }
    )
  }
}
