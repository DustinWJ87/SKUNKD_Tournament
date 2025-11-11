import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import {
  calculateRoundCount,
  generateSingleEliminationMatches,
  generateDoubleEliminationMatches,
  validateBracketCreation,
  type BracketType,
} from '@/lib/bracket-utils'

// GET /api/events/[id]/brackets - Get all brackets for an event
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const eventId = params.id

    const brackets = await prisma.bracket.findMany({
      where: { eventId },
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
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ brackets })
  } catch (error) {
    console.error('Error fetching brackets:', error)
    return NextResponse.json(
      { error: 'Failed to fetch brackets' },
      { status: 500 }
    )
  }
}

// POST /api/events/[id]/brackets - Create a new bracket for an event
export async function POST(
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

    const eventId = params.id
    const body = await request.json()
    const {
      name,
      type = 'SINGLE_ELIMINATION',
      thirdPlaceMatch = false,
      seedingMethod = 'REGISTRATION_ORDER', // REGISTRATION_ORDER, RANDOM, MANUAL
      customSeeding = [], // For manual seeding
    } = body

    // Validate event exists
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        registrations: {
          where: {
            status: 'APPROVED',
            checkInStatus: 'CHECKED_IN',
          },
          include: {
            user: true,
            team: true,
          },
        },
      },
    })

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    // Get approved and checked-in participants
    const approvedRegistrations = event.registrations

    if (approvedRegistrations.length < 2) {
      return NextResponse.json(
        { error: 'At least 2 participants are required to create a bracket' },
        { status: 400 }
      )
    }

    // Validate bracket creation
    const validation = validateBracketCreation(
      approvedRegistrations.length,
      type as BracketType
    )

    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }

    // Prepare participants with seeding
    let participants = approvedRegistrations.map((reg, index) => ({
      name: event.teamSize > 1 && reg.team ? reg.team.name : reg.user.username,
      isTeam: event.teamSize > 1 && !!reg.team,
      userId: !reg.team ? reg.user.id : undefined,
      teamId: reg.team?.id,
      seed: index + 1, // Default seeding by registration order
    }))

    // Apply seeding method
    if (seedingMethod === 'RANDOM') {
      // Shuffle participants for random seeding
      participants = participants
        .map((p) => ({ ...p, sort: Math.random() }))
        .sort((a, b) => a.sort - b.sort)
        .map((p, index) => ({ ...p, seed: index + 1 }))
    } else if (seedingMethod === 'MANUAL' && customSeeding.length > 0) {
      // Apply custom seeding
      participants = participants.map((p, index) => ({
        ...p,
        seed: customSeeding[index] || index + 1,
      }))
    }

    // Calculate rounds
    const roundCount = calculateRoundCount(participants.length, type as BracketType)

    // Create bracket
    const bracket = await prisma.bracket.create({
      data: {
        name: name || `${event.name} - ${type} Bracket`,
        type: type as BracketType,
        eventId,
        roundCount,
        thirdPlaceMatch,
      },
    })

    // Create participants
    const createdParticipants = await Promise.all(
      participants.map((p) =>
        prisma.bracketParticipant.create({
          data: {
            bracketId: bracket.id,
            seed: p.seed,
            name: p.name,
            isTeam: p.isTeam,
            userId: p.userId,
            teamId: p.teamId,
          },
        })
      )
    )

    // Generate matches based on bracket type
    let matchTemplates
    if (type === 'SINGLE_ELIMINATION') {
      matchTemplates = generateSingleEliminationMatches(
        createdParticipants.map((p) => ({
          id: p.id,
          name: p.name,
          seed: p.seed,
          isTeam: p.isTeam,
          userId: p.userId || undefined,
          teamId: p.teamId || undefined,
        })),
        thirdPlaceMatch
      )
    } else if (type === 'DOUBLE_ELIMINATION') {
      matchTemplates = generateDoubleEliminationMatches(
        createdParticipants.map((p) => ({
          id: p.id,
          name: p.name,
          seed: p.seed,
          isTeam: p.isTeam,
          userId: p.userId || undefined,
          teamId: p.teamId || undefined,
        })),
        thirdPlaceMatch
      )
    } else {
      return NextResponse.json(
        { error: 'Bracket type not yet supported' },
        { status: 400 }
      )
    }

    // Create matches in database
    const createdMatches = await Promise.all(
      matchTemplates.map((match) =>
        prisma.bracketMatch.create({
          data: {
            bracketId: bracket.id,
            round: match.round,
            matchNumber: match.matchNumber,
            position: match.position,
            isWinnersBracket: match.isWinnersBracket,
            isThirdPlace: match.isThirdPlace,
            participant1Id: match.participant1Id,
            participant2Id: match.participant2Id,
            status: match.participant1Id && match.participant2Id ? 'READY' : 
                   match.participant1Id && !match.participant2Id ? 'BYE' : 'PENDING',
          },
        })
      )
    )

    // Update nextMatchId references with actual database IDs
    for (let i = 0; i < matchTemplates.length; i++) {
      const template = matchTemplates[i]
      if (template.nextMatchId && template.nextMatchId.startsWith('position-')) {
        const targetPosition = parseInt(template.nextMatchId.replace('position-', ''))
        const targetMatch = createdMatches.find((m) => m.position === targetPosition)

        if (targetMatch) {
          await prisma.bracketMatch.update({
            where: { id: createdMatches[i].id },
            data: { nextMatchId: targetMatch.id },
          })
        }
      }
    }

    // Fetch complete bracket with all relations
    const completeBracket = await prisma.bracket.findUnique({
      where: { id: bracket.id },
      include: {
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

    return NextResponse.json({ bracket: completeBracket }, { status: 201 })
  } catch (error) {
    console.error('Error creating bracket:', error)
    return NextResponse.json(
      { error: 'Failed to create bracket' },
      { status: 500 }
    )
  }
}
