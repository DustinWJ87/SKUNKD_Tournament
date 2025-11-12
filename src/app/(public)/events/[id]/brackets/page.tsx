'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import BracketView from '@/components/bracket/bracket-view'

interface Event {
  id: string
  name: string
  game: string
  status: string
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
  event: Event
}

export default function PublicEventBracketsPage() {
  const params = useParams()
  const eventId = params.id as string

  const [brackets, setBrackets] = useState<Bracket[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedBracketId, setSelectedBracketId] = useState<string | null>(null)

  useEffect(() => {
    fetchBrackets()
  }, [])

  const fetchBrackets = async () => {
    try {
      const response = await fetch(`/api/events/${eventId}/brackets`)

      if (response.ok) {
        const data = await response.json()
        setBrackets(data.brackets || [])
        
        // Auto-select first bracket
        if (data.brackets && data.brackets.length > 0) {
          setSelectedBracketId(data.brackets[0].id)
        }
      }
    } catch (error) {
      console.error('Error fetching brackets:', error)
    } finally {
      setLoading(false)
    }
  }

  const selectedBracket = brackets.find((b) => b.id === selectedBracketId)

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

  if (brackets.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-900 via-gray-900 to-black text-white">
        <div className="container mx-auto px-4 py-8">
          <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-12 text-center">
            <div className="text-6xl mb-4">🏆</div>
            <h3 className="text-xl font-semibold mb-2">No Brackets Available</h3>
            <p className="text-gray-400 mb-4">
              Tournament brackets haven't been created yet. Check back later!
            </p>
            <Link
              href={`/events/${eventId}`}
              className="inline-block bg-purple-600 hover:bg-purple-700 px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              Back to Event
            </Link>
          </div>
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
            <Link href="/" className="hover:text-cyan-400">
              Home
            </Link>
            <span>/</span>
            <Link href="/events" className="hover:text-cyan-400">
              Events
            </Link>
            <span>/</span>
            <Link href={`/events/${eventId}`} className="hover:text-cyan-400">
              {selectedBracket?.event.name || 'Event'}
            </Link>
            <span>/</span>
            <span>Brackets</span>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2 text-cyan-400">Tournament Brackets</h1>
              {selectedBracket && (
                <p className="text-gray-400">
                  {selectedBracket.event.name} • {selectedBracket.event.game}
                </p>
              )}
            </div>
            <Link
              href={`/events/${eventId}`}
              className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg transition-colors"
            >
              ← Back to Event
            </Link>
          </div>
        </div>

        {/* Bracket Selector (if multiple brackets) */}
        {brackets.length > 1 && (
          <div className="mb-6">
            <div className="flex gap-3 overflow-x-auto pb-2">
              {brackets.map((bracket) => (
                <button
                  key={bracket.id}
                  onClick={() => setSelectedBracketId(bracket.id)}
                  className={`px-4 py-2 rounded-lg whitespace-nowrap transition-all ${
                    selectedBracketId === bracket.id
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                  }`}
                >
                  {bracket.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Selected Bracket */}
        {selectedBracket ? (
          <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
            <BracketView bracket={selectedBracket} editable={false} />
          </div>
        ) : (
          <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-12 text-center">
            <p className="text-gray-400">Select a bracket to view</p>
          </div>
        )}

        {/* Footer Info */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>
            Brackets are updated in real-time as matches are completed. Refresh the page for the
            latest results.
          </p>
        </div>
      </div>
    </div>
  )
}
