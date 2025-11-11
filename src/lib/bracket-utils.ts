/**
 * Bracket Generation Utilities
 * Handles bracket creation, seeding, and match pairing for tournaments
 */

export type BracketType = 'SINGLE_ELIMINATION' | 'DOUBLE_ELIMINATION' | 'ROUND_ROBIN' | 'SWISS'

export interface Participant {
  id: string
  name: string
  seed: number
  isTeam: boolean
  userId?: string
  teamId?: string
}

export interface Match {
  round: number
  matchNumber: number
  position: number
  participant1Id?: string
  participant2Id?: string
  nextMatchId?: string
  isWinnersBracket: boolean
  isThirdPlace: boolean
}

/**
 * Calculate the number of rounds needed for a bracket
 */
export function calculateRoundCount(participantCount: number, bracketType: BracketType): number {
  if (bracketType === 'SINGLE_ELIMINATION') {
    return Math.ceil(Math.log2(participantCount))
  }
  
  if (bracketType === 'DOUBLE_ELIMINATION') {
    // Double elimination has winners bracket + losers bracket
    const winnersRounds = Math.ceil(Math.log2(participantCount))
    const losersRounds = (winnersRounds - 1) * 2
    return winnersRounds + losersRounds + 1 // +1 for grand finals
  }
  
  if (bracketType === 'ROUND_ROBIN') {
    // Each participant plays every other participant once
    return participantCount - 1
  }
  
  if (bracketType === 'SWISS') {
    // Swiss system typically uses log2(n) + 1 rounds
    return Math.ceil(Math.log2(participantCount)) + 1
  }
  
  return 0
}

/**
 * Get the next power of 2 for bracket sizing
 */
export function getNextPowerOfTwo(n: number): number {
  return Math.pow(2, Math.ceil(Math.log2(n)))
}

/**
 * Calculate number of byes needed
 */
export function calculateByes(participantCount: number): number {
  const nextPowerOfTwo = getNextPowerOfTwo(participantCount)
  return nextPowerOfTwo - participantCount
}

/**
 * Generate seeding pairs using standard bracket seeding
 * For example, with 8 participants: [(1,8), (4,5), (2,7), (3,6)]
 */
export function generateSeedPairings(participantCount: number): Array<[number, number | null]> {
  const bracketSize = getNextPowerOfTwo(participantCount)
  const pairs: Array<[number, number | null]> = []
  
  // Generate standard seeding
  for (let i = 1; i <= bracketSize / 2; i++) {
    const topSeed = i
    const bottomSeed = bracketSize + 1 - i
    
    // If bottom seed exceeds participant count, it's a bye
    if (bottomSeed > participantCount) {
      pairs.push([topSeed, null])
    } else {
      pairs.push([topSeed, bottomSeed])
    }
  }
  
  return pairs
}

/**
 * Shuffle participants for random seeding
 */
export function shuffleParticipants<T>(array: T[]): T[] {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

/**
 * Generate single elimination bracket matches
 */
export function generateSingleEliminationMatches(
  participants: Participant[],
  includeThirdPlace: boolean = false
): Match[] {
  const matches: Match[] = []
  const participantCount = participants.length
  const roundCount = calculateRoundCount(participantCount, 'SINGLE_ELIMINATION')
  const bracketSize = getNextPowerOfTwo(participantCount)
  
  // Sort participants by seed
  const sortedParticipants = [...participants].sort((a, b) => a.seed - b.seed)
  
  // Generate seed pairings
  const pairings = generateSeedPairings(participantCount)
  
  // Track match positions for reference
  const matchIdsByRoundAndPosition: Map<string, number> = new Map()
  let globalPosition = 0
  
  // Round 1 - Initial matches
  pairings.forEach(([seed1, seed2], index) => {
    const participant1 = sortedParticipants.find(p => p.seed === seed1)
    const participant2 = seed2 ? sortedParticipants.find(p => p.seed === seed2) : undefined
    
    const match: Match = {
      round: 1,
      matchNumber: index + 1,
      position: globalPosition++,
      participant1Id: participant1?.id,
      participant2Id: participant2?.id,
      nextMatchId: undefined, // Will be set later
      isWinnersBracket: true,
      isThirdPlace: false,
    }
    
    matches.push(match)
    matchIdsByRoundAndPosition.set(`1-${index}`, matches.length - 1)
  })
  
  // Generate subsequent rounds
  for (let round = 2; round <= roundCount; round++) {
    const matchesInRound = Math.pow(2, roundCount - round)
    
    for (let matchNum = 0; matchNum < matchesInRound; matchNum++) {
      const match: Match = {
        round,
        matchNumber: matchNum + 1,
        position: globalPosition++,
        participant1Id: undefined,
        participant2Id: undefined,
        nextMatchId: undefined,
        isWinnersBracket: true,
        isThirdPlace: false,
      }
      
      matches.push(match)
      matchIdsByRoundAndPosition.set(`${round}-${matchNum}`, matches.length - 1)
    }
  }
  
  // Set nextMatchId references
  for (let round = 1; round < roundCount; round++) {
    const matchesInRound = Math.pow(2, roundCount - round)
    
    for (let matchNum = 0; matchNum < matchesInRound; matchNum++) {
      const currentMatchIndex = matchIdsByRoundAndPosition.get(`${round}-${matchNum}`)
      const nextMatchNum = Math.floor(matchNum / 2)
      const nextMatchIndex = matchIdsByRoundAndPosition.get(`${round + 1}-${nextMatchNum}`)
      
      if (currentMatchIndex !== undefined && nextMatchIndex !== undefined) {
        // Store the position instead of actual ID (will be replaced with real IDs after DB insert)
        matches[currentMatchIndex].nextMatchId = `position-${matches[nextMatchIndex].position}`
      }
    }
  }
  
  // Add third place match if requested
  if (includeThirdPlace && roundCount > 1) {
    const thirdPlaceMatch: Match = {
      round: roundCount,
      matchNumber: 2, // Finals is 1, third place is 2
      position: globalPosition++,
      participant1Id: undefined,
      participant2Id: undefined,
      nextMatchId: undefined,
      isWinnersBracket: true,
      isThirdPlace: true,
    }
    matches.push(thirdPlaceMatch)
  }
  
  return matches
}

/**
 * Generate double elimination bracket matches
 */
export function generateDoubleEliminationMatches(
  participants: Participant[],
  includeThirdPlace: boolean = false
): Match[] {
  const matches: Match[] = []
  const participantCount = participants.length
  const winnersRounds = Math.ceil(Math.log2(participantCount))
  const bracketSize = getNextPowerOfTwo(participantCount)
  
  // Sort participants by seed
  const sortedParticipants = [...participants].sort((a, b) => a.seed - b.seed)
  
  // Generate seed pairings
  const pairings = generateSeedPairings(participantCount)
  
  let globalPosition = 0
  
  // ========== WINNERS BRACKET ==========
  
  // Round 1 - Initial matches in winners bracket
  pairings.forEach(([seed1, seed2], index) => {
    const participant1 = sortedParticipants.find(p => p.seed === seed1)
    const participant2 = seed2 ? sortedParticipants.find(p => p.seed === seed2) : undefined
    
    const match: Match = {
      round: 1,
      matchNumber: index + 1,
      position: globalPosition++,
      participant1Id: participant1?.id,
      participant2Id: participant2?.id,
      nextMatchId: undefined,
      isWinnersBracket: true,
      isThirdPlace: false,
    }
    
    matches.push(match)
  })
  
  // Generate subsequent winners bracket rounds
  for (let round = 2; round <= winnersRounds; round++) {
    const matchesInRound = Math.pow(2, winnersRounds - round)
    
    for (let matchNum = 0; matchNum < matchesInRound; matchNum++) {
      const match: Match = {
        round,
        matchNumber: matchNum + 1,
        position: globalPosition++,
        participant1Id: undefined,
        participant2Id: undefined,
        nextMatchId: undefined,
        isWinnersBracket: true,
        isThirdPlace: false,
      }
      
      matches.push(match)
    }
  }
  
  // ========== LOSERS BRACKET ==========
  
  const losersRounds = (winnersRounds - 1) * 2
  
  for (let round = 1; round <= losersRounds; round++) {
    // Losers bracket has a unique structure with varying match counts
    let matchesInRound: number
    
    if (round % 2 === 1) {
      // Odd rounds receive losers from winners bracket
      matchesInRound = Math.pow(2, winnersRounds - Math.ceil(round / 2) - 1)
    } else {
      // Even rounds are consolidation rounds
      matchesInRound = Math.pow(2, winnersRounds - Math.ceil(round / 2) - 1)
    }
    
    for (let matchNum = 0; matchNum < matchesInRound; matchNum++) {
      const match: Match = {
        round: winnersRounds + round,
        matchNumber: matchNum + 1,
        position: globalPosition++,
        participant1Id: undefined,
        participant2Id: undefined,
        nextMatchId: undefined,
        isWinnersBracket: false,
        isThirdPlace: false,
      }
      
      matches.push(match)
    }
  }
  
  // ========== GRAND FINALS ==========
  
  const grandFinalsRound = winnersRounds + losersRounds + 1
  
  // Grand Finals Match 1
  matches.push({
    round: grandFinalsRound,
    matchNumber: 1,
    position: globalPosition++,
    participant1Id: undefined, // Winner of winners bracket
    participant2Id: undefined, // Winner of losers bracket
    nextMatchId: undefined,
    isWinnersBracket: true,
    isThirdPlace: false,
  })
  
  // Grand Finals Match 2 (bracket reset if losers bracket winner wins first match)
  matches.push({
    round: grandFinalsRound,
    matchNumber: 2,
    position: globalPosition++,
    participant1Id: undefined,
    participant2Id: undefined,
    nextMatchId: undefined,
    isWinnersBracket: true,
    isThirdPlace: false,
  })
  
  return matches
}

/**
 * Get match display name
 */
export function getMatchDisplayName(match: Match, totalRounds: number): string {
  if (match.isThirdPlace) {
    return '3rd Place Match'
  }
  
  if (match.round === totalRounds && match.isWinnersBracket) {
    if (match.matchNumber === 2) {
      return 'Grand Finals (Reset)'
    }
    return 'Grand Finals'
  }
  
  if (match.round === totalRounds - 1) {
    return match.isWinnersBracket ? 'Winners Finals' : 'Losers Finals'
  }
  
  if (match.round === totalRounds - 2) {
    return match.isWinnersBracket ? 'Winners Semifinals' : 'Losers Semifinals'
  }
  
  const bracketName = match.isWinnersBracket ? 'Winners' : 'Losers'
  return `${bracketName} Round ${match.round}`
}

/**
 * Validate bracket can be created
 */
export function validateBracketCreation(
  participantCount: number,
  bracketType: BracketType
): { valid: boolean; error?: string } {
  if (participantCount < 2) {
    return { valid: false, error: 'At least 2 participants are required' }
  }
  
  if (bracketType === 'SINGLE_ELIMINATION' || bracketType === 'DOUBLE_ELIMINATION') {
    if (participantCount > 256) {
      return { valid: false, error: 'Maximum 256 participants allowed' }
    }
  }
  
  if (bracketType === 'ROUND_ROBIN' && participantCount > 32) {
    return { valid: false, error: 'Round robin limited to 32 participants' }
  }
  
  return { valid: true }
}
