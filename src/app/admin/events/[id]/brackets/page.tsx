'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import BracketView from '@/components/bracket/bracket-view'

interface Event {
  id: string
  name: string
  game: string
  status: string
  teamSize: number
  _count: {
    registrations: number
  }
}

interface Bracket {
  id: string
  name: string
  type: string
  status: string
  roundCount: number
  currentRound: number
  thirdPlaceMatch: boolean
  matches: any[]
  participants: any[]
}

export default function AdminEventBracketsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const params = useParams()
  const eventId = params.id as string

  const [event, setEvent] = useState<Event | null>(null)
  const [brackets, setBrackets] = useState<Bracket[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [showCreateForm, setShowCreateForm] = useState(false)

  // Form state
  const [bracketName, setBracketName] = useState('')
  const [bracketType, setBracketType] = useState('SINGLE_ELIMINATION')
  const [seedingMethod, setSeedingMethod] = useState('REGISTRATION_ORDER')
  const [thirdPlaceMatch, setThirdPlaceMatch] = useState(false)

  // Match editing
  const [selectedMatch, setSelectedMatch] = useState<any>(null)
  const [showMatchEditor, setShowMatchEditor] = useState(false)
  const [matchWinnerId, setMatchWinnerId] = useState('')
  const [matchScore1, setMatchScore1] = useState('')
  const [matchScore2, setMatchScore2] = useState('')
  const [updatingMatch, setUpdatingMatch] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    } else if (session?.user) {
      const user = session.user as any
      if (user.role !== 'ADMIN' && user.role !== 'ORGANIZER') {
        router.push('/')
      } else {
        fetchData()
      }
    }
  }, [status, session, router])

  const fetchData = async () => {
    try {
      const [eventRes, bracketsRes] = await Promise.all([
        fetch(`/api/events/${eventId}`),
        fetch(`/api/events/${eventId}/brackets`),
      ])

      if (eventRes.ok) {
        const eventData = await eventRes.json()
        setEvent(eventData.event)
      }

      if (bracketsRes.ok) {
        const bracketsData = await bracketsRes.json()
        setBrackets(bracketsData.brackets || [])
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateBracket = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!event) return

    setCreating(true)

    try {
      const response = await fetch(`/api/events/${eventId}/brackets`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: bracketName || `${event.name} - ${bracketType}`,
          type: bracketType,
          seedingMethod,
          thirdPlaceMatch,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setBrackets([data.bracket, ...brackets])
        setShowCreateForm(false)
        setBracketName('')
        alert('Bracket created successfully!')
      } else {
        const data = await response.json()
        alert(data.error || 'Failed to create bracket')
      }
    } catch (error) {
      console.error('Error creating bracket:', error)
      alert('Failed to create bracket')
    } finally {
      setCreating(false)
    }
  }

  const handleMatchClick = (match: any) => {
    setSelectedMatch(match)
    setMatchWinnerId(match.winner?.id || '')
    setMatchScore1(match.score1?.toString() || '')
    setMatchScore2(match.score2?.toString() || '')
    setShowMatchEditor(true)
  }

  const handleUpdateMatch = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedMatch) return

    setUpdatingMatch(true)

    try {
      const response = await fetch(
        `/api/brackets/${selectedMatch.bracketId || brackets[0]?.id}/matches/${selectedMatch.id}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            winnerId: matchWinnerId || undefined,
            score1: matchScore1 ? parseInt(matchScore1) : undefined,
            score2: matchScore2 ? parseInt(matchScore2) : undefined,
          }),
        }
      )

      if (response.ok) {
        await fetchData()
        setShowMatchEditor(false)
        setSelectedMatch(null)
        alert('Match updated successfully!')
      } else {
        const data = await response.json()
        alert(data.error || 'Failed to update match')
      }
    } catch (error) {
      console.error('Error updating match:', error)
      alert('Failed to update match')
    } finally {
      setUpdatingMatch(false)
    }
  }

  const handleStartBracket = async (bracketId: string) => {
    try {
      const response = await fetch(`/api/brackets/${bracketId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'IN_PROGRESS',
        }),
      })

      if (response.ok) {
        await fetchData()
        alert('Bracket started!')
      } else {
        const data = await response.json()
        alert(data.error || 'Failed to start bracket')
      }
    } catch (error) {
      console.error('Error starting bracket:', error)
      alert('Failed to start bracket')
    }
  }

  const handleDeleteBracket = async (bracketId: string, bracketName: string) => {
    if (!confirm(`Are you sure you want to delete "${bracketName}"? This cannot be undone.`)) {
      return
    }

    try {
      const response = await fetch(`/api/brackets/${bracketId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setBrackets(brackets.filter((b) => b.id !== bracketId))
        alert('Bracket deleted successfully!')
      } else {
        const data = await response.json()
        alert(data.error || 'Failed to delete bracket')
      }
    } catch (error) {
      console.error('Error deleting bracket:', error)
      alert('Failed to delete bracket')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-900 via-gray-900 to-black text-white">
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-700 rounded w-1/4 mb-8"></div>
            <div className="h-64 bg-gray-700 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-900 via-gray-900 to-black text-white">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">Event not found</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-900 via-gray-900 to-black text-white">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-sm text-gray-400 mb-2">
            <Link href="/admin" className="hover:text-purple-400">
              Admin
            </Link>
            <span>/</span>
            <Link href="/admin/events" className="hover:text-purple-400">
              Events
            </Link>
            <span>/</span>
            <Link href={`/admin/events/${eventId}`} className="hover:text-purple-400">
              {event.name}
            </Link>
            <span>/</span>
            <span>Brackets</span>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2">Tournament Brackets</h1>
              <p className="text-gray-400">{event.name} • {event.game}</p>
            </div>
            <button
              onClick={() => setShowCreateForm(true)}
              className="bg-purple-600 hover:bg-purple-700 px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              ➕ Create Bracket
            </button>
          </div>
        </div>

        {/* Create Bracket Form Modal */}
        {showCreateForm && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full border border-gray-700">
              <h2 className="text-2xl font-bold mb-4">Create New Bracket</h2>
              <form onSubmit={handleCreateBracket}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Bracket Name</label>
                    <input
                      type="text"
                      value={bracketName}
                      onChange={(e) => setBracketName(e.target.value)}
                      placeholder={`${event.name} - Bracket`}
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:border-purple-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Bracket Type</label>
                    <select
                      value={bracketType}
                      onChange={(e) => setBracketType(e.target.value)}
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:border-purple-500"
                    >
                      <option value="SINGLE_ELIMINATION">Single Elimination</option>
                      <option value="DOUBLE_ELIMINATION">Double Elimination</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Seeding Method</label>
                    <select
                      value={seedingMethod}
                      onChange={(e) => setSeedingMethod(e.target.value)}
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:border-purple-500"
                    >
                      <option value="REGISTRATION_ORDER">Registration Order</option>
                      <option value="RANDOM">Random</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="thirdPlace"
                      checked={thirdPlaceMatch}
                      onChange={(e) => setThirdPlaceMatch(e.target.checked)}
                      className="w-4 h-4 rounded"
                    />
                    <label htmlFor="thirdPlace" className="text-sm">
                      Include 3rd Place Match
                    </label>
                  </div>

                  <div className="text-sm text-gray-400 bg-gray-700/50 p-3 rounded">
                    <p>
                      <strong>Eligible Participants:</strong>{' '}
                      {event._count.registrations} approved & checked-in
                    </p>
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowCreateForm(false)}
                    className="flex-1 bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={creating}
                    className="flex-1 bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
                  >
                    {creating ? 'Creating...' : 'Create Bracket'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Match Editor Modal */}
        {showMatchEditor && selectedMatch && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full border border-gray-700">
              <h2 className="text-2xl font-bold mb-4">Update Match Result</h2>
              <form onSubmit={handleUpdateMatch}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Winner</label>
                    <select
                      value={matchWinnerId}
                      onChange={(e) => setMatchWinnerId(e.target.value)}
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:border-purple-500"
                    >
                      <option value="">Select Winner</option>
                      {selectedMatch.participant1 && (
                        <option value={selectedMatch.participant1.id}>
                          {selectedMatch.participant1.name}
                        </option>
                      )}
                      {selectedMatch.participant2 && (
                        <option value={selectedMatch.participant2.id}>
                          {selectedMatch.participant2.name}
                        </option>
                      )}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        {selectedMatch.participant1?.name || 'P1'} Score
                      </label>
                      <input
                        type="number"
                        value={matchScore1}
                        onChange={(e) => setMatchScore1(e.target.value)}
                        min="0"
                        className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:border-purple-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        {selectedMatch.participant2?.name || 'P2'} Score
                      </label>
                      <input
                        type="number"
                        value={matchScore2}
                        onChange={(e) => setMatchScore2(e.target.value)}
                        min="0"
                        className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:border-purple-500"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowMatchEditor(false)}
                    className="flex-1 bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={updatingMatch}
                    className="flex-1 bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
                  >
                    {updatingMatch ? 'Updating...' : 'Update Match'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Brackets List */}
        {brackets.length === 0 ? (
          <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-12 text-center">
            <div className="text-6xl mb-4">🏆</div>
            <h3 className="text-xl font-semibold mb-2">No Brackets Yet</h3>
            <p className="text-gray-400 mb-4">
              Create a bracket to organize the tournament matches
            </p>
            <button
              onClick={() => setShowCreateForm(true)}
              className="bg-purple-600 hover:bg-purple-700 px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              Create First Bracket
            </button>
          </div>
        ) : (
          <div className="space-y-8">
            {brackets.map((bracket) => (
              <div
                key={bracket.id}
                className="bg-gray-800/50 border border-gray-700 rounded-lg p-6"
              >
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold">{bracket.name}</h3>
                  <div className="flex items-center gap-2">
                    {bracket.status === 'NOT_STARTED' && (
                      <button
                        onClick={() => handleStartBracket(bracket.id)}
                        className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded text-sm transition-colors"
                      >
                        Start Bracket
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteBracket(bracket.id, bracket.name)}
                      className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded text-sm transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
                <BracketView
                  bracket={bracket}
                  onMatchClick={handleMatchClick}
                  editable={true}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
