-- CreateEnum
CREATE TYPE "BracketType" AS ENUM ('SINGLE_ELIMINATION', 'DOUBLE_ELIMINATION', 'ROUND_ROBIN', 'SWISS');

-- CreateEnum
CREATE TYPE "BracketStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED');

-- CreateEnum
CREATE TYPE "MatchStatus" AS ENUM ('PENDING', 'READY', 'IN_PROGRESS', 'COMPLETED', 'BYE');

-- CreateTable
CREATE TABLE "brackets" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "BracketType" NOT NULL DEFAULT 'SINGLE_ELIMINATION',
    "status" "BracketStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "roundCount" INTEGER NOT NULL,
    "currentRound" INTEGER NOT NULL DEFAULT 1,
    "thirdPlaceMatch" BOOLEAN NOT NULL DEFAULT false,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "eventId" TEXT NOT NULL,

    CONSTRAINT "brackets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bracket_matches" (
    "id" TEXT NOT NULL,
    "round" INTEGER NOT NULL,
    "matchNumber" INTEGER NOT NULL,
    "position" INTEGER NOT NULL,
    "isWinnersBracket" BOOLEAN NOT NULL DEFAULT true,
    "isThirdPlace" BOOLEAN NOT NULL DEFAULT false,
    "status" "MatchStatus" NOT NULL DEFAULT 'PENDING',
    "participant1Id" TEXT,
    "participant2Id" TEXT,
    "winnerId" TEXT,
    "score1" INTEGER,
    "score2" INTEGER,
    "nextMatchId" TEXT,
    "nextMatchLosersBracket" TEXT,
    "scheduledTime" TIMESTAMP(3),
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "bracketId" TEXT NOT NULL,

    CONSTRAINT "bracket_matches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bracket_participants" (
    "id" TEXT NOT NULL,
    "seed" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "isTeam" BOOLEAN NOT NULL DEFAULT false,
    "userId" TEXT,
    "teamId" TEXT,
    "wins" INTEGER NOT NULL DEFAULT 0,
    "losses" INTEGER NOT NULL DEFAULT 0,
    "finalPlacement" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "bracketId" TEXT NOT NULL,

    CONSTRAINT "bracket_participants_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "bracket_participants_bracketId_seed_key" ON "bracket_participants"("bracketId", "seed");

-- AddForeignKey
ALTER TABLE "brackets" ADD CONSTRAINT "brackets_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bracket_matches" ADD CONSTRAINT "bracket_matches_participant1Id_fkey" FOREIGN KEY ("participant1Id") REFERENCES "bracket_participants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bracket_matches" ADD CONSTRAINT "bracket_matches_participant2Id_fkey" FOREIGN KEY ("participant2Id") REFERENCES "bracket_participants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bracket_matches" ADD CONSTRAINT "bracket_matches_winnerId_fkey" FOREIGN KEY ("winnerId") REFERENCES "bracket_participants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bracket_matches" ADD CONSTRAINT "bracket_matches_nextMatchId_fkey" FOREIGN KEY ("nextMatchId") REFERENCES "bracket_matches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bracket_matches" ADD CONSTRAINT "bracket_matches_bracketId_fkey" FOREIGN KEY ("bracketId") REFERENCES "brackets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bracket_participants" ADD CONSTRAINT "bracket_participants_bracketId_fkey" FOREIGN KEY ("bracketId") REFERENCES "brackets"("id") ON DELETE CASCADE ON UPDATE CASCADE;
