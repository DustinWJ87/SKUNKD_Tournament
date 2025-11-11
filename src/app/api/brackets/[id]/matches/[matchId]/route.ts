import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// PATCH /api/brackets/[id]/matches/[matchId] - Update match result
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; matchId: string } }
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

    const { id: bracketId, matchId } = params
    const body = await request.json()
    const { winnerId, score1, score2, status } = body

    // Get current match
    const match = await prisma.bracketMatch.findUnique({
      where: { id: matchId },
      include: {
        participant1: true,
        participant2: true,
        nextMatch: true,
      },
    })

    if (!match) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 })
    }

    if (match.bracketId !== bracketId) {
      return NextResponse.json({ error: 'Match does not belong to this bracket' }, { status: 400 })
    }

    // Update match
    const updateData: any = {}

    if (winnerId) {
      // Validate winner is one of the participants
      if (winnerId !== match.participant1Id && winnerId !== match.participant2Id) {
        return NextResponse.json(
          { error: 'Winner must be one of the match participants' },
          { status: 400 }
        )
      }

      updateData.winnerId = winnerId
      updateData.status = 'COMPLETED'
      updateData.completedAt = new Date()

      // Update participant stats
      const loserId = winnerId === match.participant1Id ? match.participant2Id : match.participant1Id

      if (loserId) {
        await prisma.bracketParticipant.update({
          where: { id: loserId },
          data: { losses: { increment: 1 } },
        })
      }

      await prisma.bracketParticipant.update({
        where: { id: winnerId },
        data: { wins: { increment: 1 } },
      })

      // Advance winner to next match
      if (match.nextMatchId) {
        const nextMatch = await prisma.bracketMatch.findUnique({
          where: { id: match.nextMatchId },
        })

        if (nextMatch) {
          // Determine which participant slot to fill in next match
          // This is a simplified approach - in a real implementation,
          // you'd need more complex logic based on match positioning
          if (!nextMatch.participant1Id) {
            await prisma.bracketMatch.update({
              where: { id: match.nextMatchId },
              data: {
                participant1Id: winnerId,
                status: nextMatch.participant2Id ? 'READY' : 'PENDING',
              },
            })
          } else if (!nextMatch.participant2Id) {
            await prisma.bracketMatch.update({
              where: { id: match.nextMatchId },
              data: {
                participant2Id: winnerId,
                status: 'READY',
              },
            })
          }
        }
      }
    }

    if (score1 !== undefined) {
      updateData.score1 = score1
    }

    if (score2 !== undefined) {
      updateData.score2 = score2
    }

    if (status) {
      updateData.status = status

      if (status === 'IN_PROGRESS') {
        updateData.startedAt = new Date()
      }
    }

    const updatedMatch = await prisma.bracketMatch.update({
      where: { id: matchId },
      data: updateData,
      include: {
        participant1: true,
        participant2: true,
        winner: true,
        nextMatch: true,
      },
    })

    // Check if bracket should be marked as completed
    const bracket = await prisma.bracket.findUnique({
      where: { id: bracketId },
      include: {
        matches: true,
      },
    })

    if (bracket) {
      const allMatchesCompleted = bracket.matches.every(
        (m: any) => m.status === 'COMPLETED' || m.status === 'BYE'
      )

      if (allMatchesCompleted && bracket.status !== 'COMPLETED') {
        await prisma.bracket.update({
          where: { id: bracketId },
          data: {
            status: 'COMPLETED',
            completedAt: new Date(),
          },
        })
      }
    }

    return NextResponse.json({ match: updatedMatch })
  } catch (error) {
    console.error('Error updating match:', error)
    return NextResponse.json(
      { error: 'Failed to update match' },
      { status: 500 }
    )
  }
}

// GET /api/brackets/[id]/matches/[matchId] - Get specific match
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; matchId: string } }
) {
  try {
    const { matchId } = params

    const match = await prisma.bracketMatch.findUnique({
      where: { id: matchId },
      include: {
        participant1: true,
        participant2: true,
        winner: true,
        nextMatch: true,
        previousMatches: true,
      },
    })

    if (!match) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 })
    }

    return NextResponse.json({ match })
  } catch (error) {
    console.error('Error fetching match:', error)
    return NextResponse.json(
      { error: 'Failed to fetch match' },
      { status: 500 }
    )
  }
}
