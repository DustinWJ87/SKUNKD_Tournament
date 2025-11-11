import { PrismaClient } from '@prisma/client'
import { hash } from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting seed...')

  // Clear existing data
  console.log('Clearing existing data...')
  await prisma.bracketMatch.deleteMany()
  await prisma.bracketParticipant.deleteMany()
  await prisma.bracket.deleteMany()
  await prisma.seatReservation.deleteMany()
  await prisma.seat.deleteMany()
  await prisma.teamMember.deleteMany()
  await prisma.team.deleteMany()
  await prisma.eventRegistration.deleteMany()
  await prisma.event.deleteMany()
  await prisma.user.deleteMany()

  // Create admin user
  console.log('Creating admin user...')
  const adminPassword = await hash('admin123', 12)
  const admin = await prisma.user.create({
    data: {
      email: 'admin@skunkd.gg',
      username: 'skunkd_admin',
      name: 'SKUNKD Admin',
      password: adminPassword,
      role: 'ADMIN',
      gamerTag: 'ADMIN',
    },
  })

  // Create sample users
  console.log('Creating sample users...')
  const userPassword = await hash('password123', 12)
  
  const users = await Promise.all([
    prisma.user.create({
      data: {
        email: 'player1@example.com',
        username: 'fragmaster',
        name: 'Alex Chen',
        password: userPassword,
        role: 'PLAYER',
        gamerTag: 'FragMaster99',
        bio: 'Competitive FPS player, 5+ years experience',
      },
    }),
    prisma.user.create({
      data: {
        email: 'player2@example.com',
        username: 'sniperqueen',
        name: 'Sarah Johnson',
        password: userPassword,
        role: 'PLAYER',
        gamerTag: 'SniperQueen',
        bio: 'Precision aiming specialist',
      },
    }),
    prisma.user.create({
      data: {
        email: 'player3@example.com',
        username: 'tankdaddy',
        name: 'Mike Rodriguez',
        password: userPassword,
        role: 'PLAYER',
        gamerTag: 'TankDaddy',
        bio: 'Tank main, team player',
      },
    }),
    prisma.user.create({
      data: {
        email: 'player4@example.com',
        username: 'healbot',
        name: 'Emily Park',
        password: userPassword,
        role: 'PLAYER',
        gamerTag: 'HealBot3000',
        bio: 'Support player, keeping the team alive',
      },
    }),
    prisma.user.create({
      data: {
        email: 'organizer@example.com',
        username: 'event_organizer',
        name: 'Chris Williams',
        password: userPassword,
        role: 'ORGANIZER',
        gamerTag: 'EventMaster',
        bio: 'Professional tournament organizer',
      },
    }),
    prisma.user.create({
      data: {
        email: 'player5@example.com',
        username: 'speedster',
        name: 'Jordan Lee',
        password: userPassword,
        role: 'PLAYER',
        gamerTag: 'SpeedDemon',
        bio: 'Fast reflexes, faster wins',
      },
    }),
    prisma.user.create({
      data: {
        email: 'player6@example.com',
        username: 'strategist',
        name: 'Taylor Martinez',
        password: userPassword,
        role: 'PLAYER',
        gamerTag: 'StrategyKing',
        bio: 'Big brain plays only',
      },
    }),
    prisma.user.create({
      data: {
        email: 'player7@example.com',
        username: 'clutchmaster',
        name: 'Jamie Wilson',
        password: userPassword,
        role: 'PLAYER',
        gamerTag: 'ClutchMaster',
        bio: '1v5? No problem',
      },
    }),
    prisma.user.create({
      data: {
        email: 'player8@example.com',
        username: 'headshot',
        name: 'Casey Brown',
        password: userPassword,
        role: 'PLAYER',
        gamerTag: 'HeadshotOnly',
        bio: 'Aim is everything',
      },
    }),
  ])

  // Create upcoming events
  console.log('Creating events...')
  
  const event1 = await prisma.event.create({
    data: {
      name: 'SKUNKD Winter Championship 2025',
      description: 'Join us for the biggest Counter-Strike 2 tournament of the season! Compete for glory and amazing prizes.',
      game: 'Counter-Strike 2',
      startDate: new Date('2025-12-15T10:00:00Z'),
      endDate: new Date('2025-12-15T18:00:00Z'),
      registrationStart: new Date('2025-11-01T00:00:00Z'),
      registrationEnd: new Date('2025-12-10T23:59:59Z'),
      maxParticipants: 50,
      teamSize: 5,
      entryFee: 25.00,
      prizePool: 1000.00,
      status: 'REGISTRATION_OPEN',
      venue: 'Gaming Arena Seattle',
      venueAddress: '123 Gaming Arena, Seattle, WA 98101',
      creatorId: admin.id,
    },
  })

  const event2 = await prisma.event.create({
    data: {
      name: 'Valorant Spring Showdown',
      description: 'Regional Valorant tournament featuring the best teams in the Pacific Northwest.',
      game: 'Valorant',
      startDate: new Date('2025-11-20T12:00:00Z'),
      endDate: new Date('2025-11-20T20:00:00Z'),
      registrationStart: new Date('2025-10-20T00:00:00Z'),
      registrationEnd: new Date('2025-11-15T23:59:59Z'),
      maxParticipants: 40,
      teamSize: 5,
      entryFee: 30.00,
      prizePool: 1500.00,
      status: 'REGISTRATION_OPEN',
      venue: 'Esports Center Portland',
      venueAddress: '456 Esports Center, Portland, OR 97201',
      creatorId: users[4].id, // Organizer
    },
  })

  const event3 = await prisma.event.create({
    data: {
      name: 'Rocket League 2v2 Tournament',
      description: 'Fast-paced 2v2 Rocket League action! Bring your partner and show off your skills.',
      game: 'Rocket League',
      startDate: new Date('2025-11-10T14:00:00Z'),
      endDate: new Date('2025-11-10T19:00:00Z'),
      registrationStart: new Date('2025-10-10T00:00:00Z'),
      registrationEnd: new Date('2025-11-08T23:59:59Z'),
      maxParticipants: 32,
      teamSize: 2,
      entryFee: 15.00,
      prizePool: 400.00,
      status: 'REGISTRATION_OPEN',
      venue: 'Game Hub Vancouver',
      venueAddress: '789 Game Hub, Vancouver, BC V6B 2W8',
      creatorId: admin.id,
    },
  })

  const event4 = await prisma.event.create({
    data: {
      name: 'League of Legends Clash Night',
      description: 'Weekly League of Legends tournament for amateur teams. Prove your worth on the Rift!',
      game: 'League of Legends',
      startDate: new Date('2025-11-06T18:00:00Z'),
      endDate: new Date('2025-11-06T23:00:00Z'),
      registrationStart: new Date('2025-10-06T00:00:00Z'),
      registrationEnd: new Date('2025-11-05T20:00:00Z'),
      maxParticipants: 50,
      teamSize: 5,
      entryFee: 0.00, // Free event
      prizePool: 250.00, // Sponsored prizes
      status: 'REGISTRATION_OPEN',
      venue: 'Online',
      venueAddress: 'Online Tournament',
      isOnline: true,
      creatorId: users[4].id,
    },
  })

  const pastEvent = await prisma.event.create({
    data: {
      name: 'SKUNKD Summer Slam 2025',
      description: 'Epic summer tournament that already concluded.',
      game: 'Counter-Strike 2',
      startDate: new Date('2025-08-15T10:00:00Z'),
      endDate: new Date('2025-08-15T18:00:00Z'),
      registrationStart: new Date('2025-07-15T00:00:00Z'),
      registrationEnd: new Date('2025-08-10T23:59:59Z'),
      maxParticipants: 60,
      teamSize: 5,
      entryFee: 25.00,
      prizePool: 2000.00,
      status: 'COMPLETED',
      venue: 'Gaming Arena Seattle',
      venueAddress: '123 Gaming Arena, Seattle, WA 98101',
      creatorId: admin.id,
    },
  })

  // Create seats for event 1 (Winter Championship)
  console.log('Creating seats for Winter Championship...')
  const seatPromises1 = []
  for (let i = 1; i <= 50; i++) {
    const seatType = i <= 10 ? 'VIP' : 'STANDARD'
    const rowIndex = Math.floor((i - 1) / 10)
    const seatInRow = ((i - 1) % 10) + 1
    const rowLetter = String.fromCharCode(65 + rowIndex)
    const label = `${rowLetter}${seatInRow}`
    seatPromises1.push(
      prisma.seat.create({
        data: {
          eventId: event1.id,
          label: label,
          number: i,
          row: rowLetter,
          type: seatType,
        },
      })
    )
  }
  await Promise.all(seatPromises1)

  // Create seats for event 2 (Valorant)
  console.log('Creating seats for Valorant Showdown...')
  const seatPromises2 = []
  for (let i = 1; i <= 40; i++) {
    const seatType = i <= 8 ? 'VIP' : 'STANDARD'
    const rowIndex = Math.floor((i - 1) / 10)
    const seatInRow = ((i - 1) % 10) + 1
    const rowLetter = String.fromCharCode(65 + rowIndex)
    const label = `${rowLetter}${seatInRow}`
    seatPromises2.push(
      prisma.seat.create({
        data: {
          eventId: event2.id,
          label: label,
          number: i,
          row: rowLetter,
          type: seatType,
        },
      })
    )
  }
  await Promise.all(seatPromises2)

  // Create seats for event 3 (Rocket League)
  console.log('Creating seats for Rocket League Tournament...')
  const seatPromises3 = []
  for (let i = 1; i <= 32; i++) {
    const seatType = i <= 6 ? 'VIP' : 'STANDARD'
    const rowIndex = Math.floor((i - 1) / 8)
    const seatInRow = ((i - 1) % 8) + 1
    const rowLetter = String.fromCharCode(65 + rowIndex)
    const label = `${rowLetter}${seatInRow}`
    seatPromises3.push(
      prisma.seat.create({
        data: {
          eventId: event3.id,
          label: label,
          number: i,
          row: rowLetter,
          type: seatType,
        },
      })
    )
  }
  await Promise.all(seatPromises3)

  // Create seats for event 4 (League of Legends - Online, but still has "virtual seats")
  console.log('Creating seats for LoL Clash Night...')
  const seatPromises4 = []
  for (let i = 1; i <= 50; i++) {
    const seatType = i <= 10 ? 'VIP' : 'STANDARD'
    const rowIndex = Math.floor((i - 1) / 10)
    const seatInRow = ((i - 1) % 10) + 1
    const rowLetter = String.fromCharCode(65 + rowIndex)
    const label = `${rowLetter}${seatInRow}`
    seatPromises4.push(
      prisma.seat.create({
        data: {
          eventId: event4.id,
          label: label,
          number: i,
          row: rowLetter,
          type: seatType,
        },
      })
    )
  }
  await Promise.all(seatPromises4)

  // Create seats for past event (Summer Slam)
  console.log('Creating seats for Summer Slam (past event)...')
  const seatPromisesPast = []
  for (let i = 1; i <= 60; i++) {
    const seatType = i <= 12 ? 'VIP' : 'STANDARD'
    const rowIndex = Math.floor((i - 1) / 10)
    const seatInRow = ((i - 1) % 10) + 1
    const rowLetter = String.fromCharCode(65 + rowIndex)
    const label = `${rowLetter}${seatInRow}`
    seatPromisesPast.push(
      prisma.seat.create({
        data: {
          eventId: pastEvent.id,
          label: label,
          number: i,
          row: rowLetter,
          type: seatType,
        },
      })
    )
  }
  await Promise.all(seatPromisesPast)

  // Create sample teams and registrations
  console.log('Creating teams and registrations...')
  
  const team1 = await prisma.team.create({
    data: {
      name: 'Pixel Crushers',
      tag: 'PXL',
      description: 'Elite CS2 squad looking to dominate',
      creatorId: users[0].id,
    },
  })

  // Add team members
  await prisma.teamMember.create({
    data: {
      teamId: team1.id,
      userId: users[0].id,
      role: 'CAPTAIN',
    },
  })

  await prisma.teamMember.create({
    data: {
      teamId: team1.id,
      userId: users[1].id,
      role: 'MEMBER',
    },
  })

  await prisma.teamMember.create({
    data: {
      teamId: team1.id,
      userId: users[2].id,
      role: 'MEMBER',
    },
  })

  // Register team for Winter Championship
  const registration1 = await prisma.eventRegistration.create({
    data: {
      eventId: event1.id,
      userId: users[0].id,
      teamId: team1.id,
      status: 'APPROVED',
      checkInStatus: 'NOT_CHECKED_IN',
      paymentStatus: 'PAID',
      paymentAmount: 25.00,
    },
  })

  // Pending registration
  const registration3 = await prisma.eventRegistration.create({
    data: {
      eventId: event2.id, // Valorant
      userId: users[0].id,
      status: 'PENDING',
      checkInStatus: 'NOT_CHECKED_IN',
      paymentStatus: 'PENDING',
      paymentAmount: 0.00,
    },
  })

  // Reserve some seats
  console.log('Creating seat reservations...')
  const seats = await prisma.seat.findMany({
    where: { eventId: event1.id },
    take: 5,
  })

  await prisma.seatReservation.create({
    data: {
      seatId: seats[0].id,
      userId: users[0].id,
      status: 'CONFIRMED',
    },
  })

  await prisma.seatReservation.create({
    data: {
      seatId: seats[1].id,
      userId: users[1].id,
      status: 'CONFIRMED',
    },
  })

  // Create additional registrations for bracket demonstration
  console.log('Creating additional registrations for bracket demo...')
  
  const registrations = []
  
  // Create 8 approved and checked-in registrations for event3 (Rocket League)
  // Users 0-7 (first 8 users) will participate
  for (let i = 0; i < 8; i++) {
    const reg = await prisma.eventRegistration.create({
      data: {
        eventId: event3.id,
        userId: users[i].id,
        status: 'APPROVED',
        checkInStatus: 'CHECKED_IN',
        paymentStatus: 'PAID',
        paymentAmount: 15.00,
      },
    })
    registrations.push(reg)
  }

  // Create a bracket for the Rocket League tournament with matches
  console.log('Creating bracket with matches...')
  
  const bracket = await prisma.bracket.create({
    data: {
      eventId: event3.id,
      name: 'Main Bracket',
      type: 'SINGLE_ELIMINATION',
      status: 'IN_PROGRESS',
      roundCount: 3, // 8 players = 3 rounds (quarterfinals, semifinals, finals)
      currentRound: 1,
      startedAt: new Date(),
    },
  })

  // Create participants
  const participants = []
  for (let i = 0; i < 8; i++) {
    const participant = await prisma.bracketParticipant.create({
      data: {
        bracketId: bracket.id,
        userId: users[i].id,
        seed: i + 1,
        name: users[i].gamerTag || users[i].username,
      },
    })
    participants.push(participant)
  }

  // Create matches for single elimination (8 participants = 7 matches total)
  // Round 1: 4 matches (quarterfinals)
  const quarterfinal1 = await prisma.bracketMatch.create({
    data: {
      bracketId: bracket.id,
      round: 1,
      matchNumber: 1,
      position: 1,
      participant1Id: participants[0].id, // Seed 1
      participant2Id: participants[7].id, // Seed 8
      winnerId: participants[0].id, // Seed 1 wins
      score1: 3,
      score2: 1,
      status: 'COMPLETED',
    },
  })

  const quarterfinal2 = await prisma.bracketMatch.create({
    data: {
      bracketId: bracket.id,
      round: 1,
      matchNumber: 2,
      position: 2,
      participant1Id: participants[3].id, // Seed 4
      participant2Id: participants[4].id, // Seed 5
      winnerId: participants[4].id, // Seed 5 wins (upset!)
      score1: 2,
      score2: 3,
      status: 'COMPLETED',
    },
  })

  const quarterfinal3 = await prisma.bracketMatch.create({
    data: {
      bracketId: bracket.id,
      round: 1,
      matchNumber: 3,
      position: 3,
      participant1Id: participants[1].id, // Seed 2
      participant2Id: participants[6].id, // Seed 7
      winnerId: participants[1].id, // Seed 2 wins
      score1: 3,
      score2: 0,
      status: 'COMPLETED',
    },
  })

  const quarterfinal4 = await prisma.bracketMatch.create({
    data: {
      bracketId: bracket.id,
      round: 1,
      matchNumber: 4,
      position: 4,
      participant1Id: participants[2].id, // Seed 3
      participant2Id: participants[5].id, // Seed 6
      status: 'IN_PROGRESS', // This match is currently happening
    },
  })

  // Round 2: 2 matches (semifinals)
  const semifinal1 = await prisma.bracketMatch.create({
    data: {
      bracketId: bracket.id,
      round: 2,
      matchNumber: 1,
      position: 5,
      participant1Id: participants[0].id, // Winner of QF1
      participant2Id: participants[4].id, // Winner of QF2
      status: 'PENDING',
    },
  })

  const semifinal2 = await prisma.bracketMatch.create({
    data: {
      bracketId: bracket.id,
      round: 2,
      matchNumber: 2,
      position: 6,
      participant1Id: participants[1].id, // Winner of QF3
      status: 'PENDING', // Waiting for QF4 to complete
    },
  })

  // Round 3: 1 match (finals)
  const final = await prisma.bracketMatch.create({
    data: {
      bracketId: bracket.id,
      round: 3,
      matchNumber: 1,
      position: 7,
      status: 'PENDING',
    },
  })

  // Update matches with nextMatchId references
  await prisma.bracketMatch.update({
    where: { id: quarterfinal1.id },
    data: { nextMatchId: semifinal1.id },
  })

  await prisma.bracketMatch.update({
    where: { id: quarterfinal2.id },
    data: { nextMatchId: semifinal1.id },
  })

  await prisma.bracketMatch.update({
    where: { id: quarterfinal3.id },
    data: { nextMatchId: semifinal2.id },
  })

  await prisma.bracketMatch.update({
    where: { id: quarterfinal4.id },
    data: { nextMatchId: semifinal2.id },
  })

  await prisma.bracketMatch.update({
    where: { id: semifinal1.id },
    data: { nextMatchId: final.id },
  })

  await prisma.bracketMatch.update({
    where: { id: semifinal2.id },
    data: { nextMatchId: final.id },
  })

  // Update participant stats
  await prisma.bracketParticipant.update({
    where: { id: participants[0].id },
    data: { wins: 1, losses: 0 },
  })

  await prisma.bracketParticipant.update({
    where: { id: participants[1].id },
    data: { wins: 1, losses: 0 },
  })

  await prisma.bracketParticipant.update({
    where: { id: participants[4].id },
    data: { wins: 1, losses: 0 },
  })

  await prisma.bracketParticipant.update({
    where: { id: participants[3].id },
    data: { wins: 0, losses: 1 },
  })

  await prisma.bracketParticipant.update({
    where: { id: participants[6].id },
    data: { wins: 0, losses: 1 },
  })

  await prisma.bracketParticipant.update({
    where: { id: participants[7].id },
    data: { wins: 0, losses: 1 },
  })

  console.log('✅ Seed completed successfully!')
  console.log('\n📊 Seeded data summary:')
  console.log(`- Users: ${users.length + 1} (${users.length} players/organizer + 1 admin)`)
  console.log(`- Events: 5 (4 upcoming, 1 past)`)
  console.log(`- Teams: 1`)
  console.log(`- Registrations: ${2 + registrations.length} (including bracket participants)`)
  console.log(`- Brackets: 1 (8-player single elimination)`)
  console.log(`- Bracket Matches: 7 (3 completed, 1 in progress, 3 pending)`)
  console.log(`- Seats: 232 total across all events`)
  console.log(`- Seat Reservations: 2`)
  console.log('\n🎮 Bracket Demo:')
  console.log(`Event: ${event3.name}`)
  console.log('Status: Quarterfinals in progress!')
  console.log('- Match 1 (Completed): FragMaster99 defeated HeadshotOnly 3-1')
  console.log('- Match 2 (Completed): SpeedDemon upset TankDaddy 3-2!')
  console.log('- Match 3 (Completed): SniperQueen dominated StrategyKing 3-0')
  console.log('- Match 4 (In Progress): HealBot3000 vs ClutchMaster')
  console.log('\n🔐 Login credentials:')
  console.log('Admin: admin@skunkd.gg / admin123')
  console.log('Player: player1@example.com / password123')
  console.log('Organizer: organizer@example.com / password123')
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
