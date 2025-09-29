const { PrismaClient } = require('../src/generated/prisma');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create superadmin user (you)
  const superAdminUser = await prisma.user.upsert({
    where: { email: 'you@example.com' },
    update: {},
    create: {
      email: 'you@example.com',
      name: 'Super Admin',
      role: 'SUPERADMIN',
    },
  });

  // Create admin user (now event organizer)
  const eventOrganizerUser = await prisma.user.upsert({
    where: { email: 'admin@skunkd.com' },
    update: { role: 'EVENT_ORGANIZER' },
    create: {
      email: 'admin@skunkd.com',
      name: 'Event Organizer',
      role: 'EVENT_ORGANIZER',
    },
  });

  // Create regular user (now player)
  const playerUser = await prisma.user.upsert({
    where: { email: 'player@skunkd.com' },
    update: { role: 'PLAYER' },
    create: {
      email: 'player@skunkd.com',
      name: 'Test Player',
      role: 'PLAYER',
    },
  });

  // Create a sample seat map
  const seatMap = await prisma.seatMap.create({
    data: {
      name: 'Main Arena',
      description: 'Primary tournament arena with 50 gaming stations',
      width: 10,
      height: 5,
      creatorId: eventOrganizerUser.id,
    },
  });

  // Create seats for the seat map
  const seats = [];
  for (let row = 1; row <= 5; row++) {
    for (let col = 1; col <= 10; col++) {
      seats.push({
        row,
        column: col,
        label: `${String.fromCharCode(64 + row)}${col}`, // A1, A2, B1, B2, etc.
        type: col <= 2 ? 'VIP' : 'REGULAR', // First 2 columns are VIP
        status: 'AVAILABLE',
        seatMapId: seatMap.id,
      });
    }
  }

  await prisma.seat.createMany({
    data: seats,
  });

  // Create sample events
  const now = new Date();
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const event1 = await prisma.event.create({
    data: {
      title: 'Valorant Championship',
      description: 'Competitive Valorant tournament with $5000 prize pool',
      game: 'Valorant',
      maxTeams: 16,
      maxPlayers: 80,
      teamSize: 5,
      entryFee: 25.00,
      prizePool: 5000.00,
      status: 'REGISTRATION_OPEN',
      registrationStart: now,
      registrationEnd: tomorrow,
      eventStart: nextWeek,
      eventEnd: new Date(nextWeek.getTime() + 8 * 60 * 60 * 1000), // 8 hours later
      creatorId: eventOrganizerUser.id,
      seatMapId: seatMap.id,
    },
  });

  const event2 = await prisma.event.create({
    data: {
      title: 'CS2 Solo Tournament',
      description: 'Individual Counter-Strike 2 competition',
      game: 'Counter-Strike 2',
      maxPlayers: 32,
      teamSize: 1,
      entryFee: 15.00,
      prizePool: 1500.00,
      status: 'PUBLISHED',
      registrationStart: tomorrow,
      registrationEnd: new Date(tomorrow.getTime() + 3 * 24 * 60 * 60 * 1000),
      eventStart: new Date(nextWeek.getTime() + 2 * 24 * 60 * 60 * 1000),
      creatorId: eventOrganizerUser.id,
      seatMapId: seatMap.id,
    },
  });

  // Create a sample team for the Valorant event
  const team = await prisma.team.create({
    data: {
      name: 'Skunkd Legends',
      description: 'Elite Valorant team',
      eventId: event1.id,
    },
  });

  // Add team member
  await prisma.teamMember.create({
    data: {
      userId: playerUser.id,
      teamId: team.id,
      role: 'CAPTAIN',
      status: 'ACCEPTED',
    },
  });

  // Create sample registration
  await prisma.registration.create({
    data: {
      userId: playerUser.id,
      eventId: event1.id,
      seatId: seats[0] ? (await prisma.seat.findFirst({ where: { seatMapId: seatMap.id } }))?.id : undefined,
      status: 'CONFIRMED',
    },
  });

  console.log('✅ Database seeded successfully!');
  console.log(`👤 Super Admin: superadmin@skunkd.com`);
  console.log(`👤 Event Organizer: admin@skunkd.com`);
  console.log(`👤 Test Player: player@skunkd.com`);
  console.log(`🎮 Created ${seats.length} seats in Main Arena`);
  console.log(`🏆 Created 2 sample events`);
  console.log(`👥 Created 1 sample team with 1 member`);
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });