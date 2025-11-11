'use client'

import { useState } from 'react'

interface BracketParticipant {
  id: string
  name: string
  seed: number
  wins: number
  losses: number
  finalPlacement?: number | null
}

interface BracketMatch {
  id: string
  round: number
  matchNumber: number
  position: number
  status: string
  isWinnersBracket: boolean
  isThirdPlace: boolean
  participant1?: BracketParticipant | null
  participant2?: BracketParticipant | null
  winner?: BracketParticipant | null
  score1?: number | null
  score2?: number | null
  scheduledTime?: string | null
}

interface Bracket {
  id: string
  name: string
  type: string
  status: string
  roundCount: number
  currentRound: number
  thirdPlaceMatch: boolean
  matches: BracketMatch[]
  participants: BracketParticipant[]
}

interface BracketViewProps {
  bracket: Bracket
  onMatchClick?: (match: BracketMatch) => void
  editable?: boolean
}

export default function BracketView({ bracket, onMatchClick, editable = false }: BracketViewProps) {
  const [selectedMatch, setSelectedMatch] = useState<string | null>(null)

  // Group matches by round
  const matchesByRound: Record<number, BracketMatch[]> = {}
  bracket.matches.forEach((match) => {
    if (!matchesByRound[match.round]) {
      matchesByRound[match.round] = []
    }
    matchesByRound[match.round].push(match)
  })

  // Sort matches within each round by position
  Object.keys(matchesByRound).forEach((round) => {
    matchesByRound[parseInt(round)].sort((a, b) => a.position - a.position)
  })

  const rounds = Object.keys(matchesByRound)
    .map(Number)
    .sort((a, b) => a - b)

  const handleMatchClick = (match: BracketMatch) => {
    setSelectedMatch(match.id)
    if (onMatchClick) {
      onMatchClick(match)
    }
  }

  const getMatchStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'border-green-500/50 bg-green-500/10'
      case 'IN_PROGRESS':
        return 'border-yellow-500/50 bg-yellow-500/10'
      case 'READY':
        return 'border-blue-500/50 bg-blue-500/10'
      case 'BYE':
        return 'border-gray-500/30 bg-gray-800/30'
      default:
        return 'border-gray-700 bg-gray-800/50'
    }
  }

  const getRoundName = (round: number) => {
    const totalRounds = bracket.roundCount
    const winnersRounds = bracket.type === 'DOUBLE_ELIMINATION' 
      ? Math.ceil(Math.log2(bracket.participants.length))
      : totalRounds

    if (bracket.type === 'SINGLE_ELIMINATION') {
      if (round === totalRounds) return 'Finals'
      if (round === totalRounds - 1) return 'Semifinals'
      if (round === totalRounds - 2) return 'Quarterfinals'
      return `Round ${round}`
    }

    if (bracket.type === 'DOUBLE_ELIMINATION') {
      if (round === totalRounds) return 'Grand Finals'
      if (round > winnersRounds) return `Losers Round ${round - winnersRounds}`
      if (round === winnersRounds) return 'Winners Finals'
      if (round === winnersRounds - 1) return 'Winners Semifinals'
      return `Winners Round ${round}`
    }

    return `Round ${round}`
  }

  return (
    <div className="w-full">
      {/* Bracket Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-2xl font-bold">{bracket.name}</h2>
          <div className="flex items-center gap-2">
            <span className={`px-3 py-1 rounded text-sm font-medium ${
              bracket.status === 'COMPLETED' ? 'bg-green-500/20 text-green-400' :
              bracket.status === 'IN_PROGRESS' ? 'bg-yellow-500/20 text-yellow-400' :
              'bg-gray-500/20 text-gray-400'
            }`}>
              {bracket.status.replace('_', ' ')}
            </span>
            <span className="px-3 py-1 rounded text-sm bg-purple-500/20 text-purple-400">
              {bracket.type.replace('_', ' ')}
            </span>
          </div>
        </div>
        <p className="text-gray-400 text-sm">
          {bracket.participants.length} Participants • {bracket.roundCount} Rounds
          {bracket.thirdPlaceMatch && ' • Includes 3rd Place Match'}
        </p>
      </div>

      {/* Bracket Visualization */}
      <div className="relative overflow-x-auto">
        <div className="flex gap-8 pb-4" style={{ minWidth: 'fit-content' }}>
          {rounds.map((round) => {
            const matches = matchesByRound[round]
            const isThirdPlaceRound = matches.some(m => m.isThirdPlace)

            return (
              <div key={round} className="flex flex-col min-w-[280px]">
                {/* Round Header */}
                <div className="mb-4 sticky top-0 bg-gradient-to-b from-gray-900 to-transparent pb-2 z-10">
                  <h3 className="text-lg font-semibold text-center">
                    {getRoundName(round)}
                  </h3>
                  <p className="text-xs text-gray-500 text-center">
                    {matches.filter(m => !m.isThirdPlace).length} {matches.filter(m => !m.isThirdPlace).length === 1 ? 'Match' : 'Matches'}
                  </p>
                </div>

                {/* Matches */}
                <div className="flex flex-col justify-around gap-4 flex-1">
                  {matches.map((match) => (
                    <div
                      key={match.id}
                      className={`relative ${match.isThirdPlace ? 'mt-8' : ''}`}
                    >
                      {match.isThirdPlace && (
                        <div className="absolute -top-6 left-0 right-0 text-center">
                          <span className="text-xs font-medium text-yellow-400 bg-yellow-500/20 px-2 py-1 rounded">
                            3rd Place
                          </span>
                        </div>
                      )}
                      
                      <button
                        onClick={() => handleMatchClick(match)}
                        disabled={!editable && match.status === 'PENDING'}
                        className={`w-full border-2 rounded-lg p-3 transition-all ${getMatchStatusColor(
                          match.status
                        )} ${
                          selectedMatch === match.id ? 'ring-2 ring-purple-500' : ''
                        } ${
                          editable || match.status !== 'PENDING'
                            ? 'cursor-pointer hover:border-purple-500'
                            : 'cursor-not-allowed opacity-60'
                        }`}
                      >
                        {/* Match Header */}
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs text-gray-400">
                            Match {match.matchNumber}
                          </span>
                          {match.status === 'BYE' && (
                            <span className="text-xs text-gray-500">BYE</span>
                          )}
                          {match.scheduledTime && (
                            <span className="text-xs text-gray-500">
                              {new Date(match.scheduledTime).toLocaleDateString()}
                            </span>
                          )}
                        </div>

                        {/* Participant 1 */}
                        <div
                          className={`flex items-center justify-between p-2 rounded mb-1 ${
                            match.winner?.id === match.participant1?.id
                              ? 'bg-green-500/20 border border-green-500/30'
                              : 'bg-gray-700/30'
                          }`}
                        >
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <span className="text-xs text-gray-500 flex-shrink-0">
                              {match.participant1?.seed ? `#${match.participant1.seed}` : '—'}
                            </span>
                            <span className={`text-sm truncate ${
                              !match.participant1 ? 'text-gray-600 italic' : ''
                            }`}>
                              {match.participant1?.name || 'TBD'}
                            </span>
                          </div>
                          {match.score1 !== null && match.score1 !== undefined && (
                            <span className="text-sm font-bold ml-2">{match.score1}</span>
                          )}
                          {match.winner?.id === match.participant1?.id && (
                            <span className="ml-2 text-green-400">✓</span>
                          )}
                        </div>

                        {/* VS Divider */}
                        <div className="text-center text-xs text-gray-500 my-1">vs</div>

                        {/* Participant 2 */}
                        <div
                          className={`flex items-center justify-between p-2 rounded ${
                            match.winner?.id === match.participant2?.id
                              ? 'bg-green-500/20 border border-green-500/30'
                              : 'bg-gray-700/30'
                          }`}
                        >
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <span className="text-xs text-gray-500 flex-shrink-0">
                              {match.participant2?.seed ? `#${match.participant2.seed}` : '—'}
                            </span>
                            <span className={`text-sm truncate ${
                              !match.participant2 ? 'text-gray-600 italic' : ''
                            }`}>
                              {match.participant2?.name || 'TBD'}
                            </span>
                          </div>
                          {match.score2 !== null && match.score2 !== undefined && (
                            <span className="text-sm font-bold ml-2">{match.score2}</span>
                          )}
                          {match.winner?.id === match.participant2?.id && (
                            <span className="ml-2 text-green-400">✓</span>
                          )}
                        </div>
                      </button>

                      {/* Connection lines would go here in a more advanced implementation */}
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Participants List (Seeding) */}
      {bracket.participants.length > 0 && (
        <div className="mt-8">
          <h3 className="text-lg font-semibold mb-4">Participants & Seeding</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {bracket.participants
              .sort((a, b) => a.seed - b.seed)
              .map((participant) => (
                <div
                  key={participant.id}
                  className="bg-gray-800/50 border border-gray-700 rounded-lg p-3"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-bold text-purple-400">
                      #{participant.seed}
                    </span>
                    <span className="text-sm truncate">{participant.name}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-400">
                    <span className="text-green-400">{participant.wins}W</span>
                    <span className="text-red-400">{participant.losses}L</span>
                    {participant.finalPlacement && (
                      <span className="ml-auto text-yellow-400">
                        {participant.finalPlacement === 1 && '🥇'}
                        {participant.finalPlacement === 2 && '🥈'}
                        {participant.finalPlacement === 3 && '🥉'}
                        {participant.finalPlacement > 3 && `${participant.finalPlacement}th`}
                      </span>
                    )}
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  )
}
