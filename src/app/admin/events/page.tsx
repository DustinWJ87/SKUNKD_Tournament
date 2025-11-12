'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Event {
  id: string
  name: string
  game: string
  startDate: string
  endDate: string | null
  registrationStart: string
  registrationEnd: string
  maxParticipants: number
  status: string
  entryFee: number
  prizePool: number | null
  venue: string | null
  isOnline: boolean
  _count?: {
    registrations: number
  }
}

export default function AdminEventsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    } else if (session?.user && session.user.role !== 'ADMIN' && session.user.role !== 'ORGANIZER') {
      router.push('/')
    }
  }, [session, status, router])

  useEffect(() => {
    fetchEvents()
  }, [filter])

  const fetchEvents = async () => {
    try {
      setLoading(true)
      let url = '/api/events?all=true'
      if (filter !== 'all') {
        url = `/api/events?status=${filter}`
      }
      const response = await fetch(url)
      if (response.ok) {
        const data = await response.json()
        setEvents(data.events || [])
      }
    } catch (error) {
      console.error('Failed to fetch events:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return 'bg-gray-500'
      case 'REGISTRATION_OPEN':
        return 'bg-green-500'
      case 'REGISTRATION_CLOSED':
        return 'bg-yellow-500'
      case 'IN_PROGRESS':
        return 'bg-blue-500'
      case 'COMPLETED':
        return 'bg-purple-500'
      case 'CANCELLED':
        return 'bg-red-500'
      default:
        return 'bg-gray-500'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const formatStatus = (status: string) => {
    return status.split('_').map(word => 
      word.charAt(0) + word.slice(1).toLowerCase()
    ).join(' ')
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-midnight-900 flex items-center justify-center">
        <div className="text-cyan-400 text-xl">Loading...</div>
      </div>
    )
  }

  if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'ORGANIZER')) {
    return null
  }

  return (
    <div className="min-h-screen bg-midnight-900 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 sm:gap-6">
            <div className="flex-1 min-w-0">
              <h1 className="text-3xl sm:text-4xl font-bold text-cyan-400 mb-2">Event Management</h1>
              <p className="text-gray-400 text-sm sm:text-base">Manage all tournament events</p>
            </div>
            <Link
              href="/admin/events/create"
              className="bg-gradient-to-r from-cyan-500 to-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-cyan-600 hover:to-purple-700 transition-all shadow-lg hover:shadow-cyan-500/50 whitespace-nowrap text-center sm:self-start"
            >
              + Create Event
            </Link>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="mb-6 flex gap-2 flex-wrap">
          {['all', 'DRAFT', 'REGISTRATION_OPEN', 'REGISTRATION_CLOSED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                filter === status
                  ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/50'
                  : 'bg-midnight-800 text-gray-400 hover:bg-midnight-700'
              }`}
            >
              {status === 'all' ? 'All Events' : formatStatus(status)}
            </button>
          ))}
        </div>

        {/* Events Table */}
        <div className="bg-midnight-800 rounded-lg border border-cyan-500/20 overflow-hidden">
          {events.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-gray-400 text-lg">No events found</p>
              <Link
                href="/admin/events/create"
                className="inline-block mt-4 text-cyan-400 hover:text-cyan-300 underline"
              >
                Create your first event
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-midnight-950 border-b border-cyan-500/20">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-cyan-400">Event</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-cyan-400">Game</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-cyan-400">Start Date</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-cyan-400">Status</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-cyan-400">Registrations</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-cyan-400">Prize Pool</th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-cyan-400">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-cyan-500/10">
                  {events.map((event) => (
                    <tr key={event.id} className="hover:bg-midnight-700/50 transition-colors">
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-medium text-white">{event.name}</div>
                          <div className="text-sm text-gray-400">
                            {event.isOnline ? '🌐 Online' : `📍 ${event.venue || 'TBA'}`}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-300">{event.game}</td>
                      <td className="px-6 py-4 text-gray-300 text-sm">
                        {formatDate(event.startDate)}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`${getStatusColor(event.status)} text-white px-3 py-1 rounded-full text-xs font-medium`}>
                          {formatStatus(event.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-300">
                        <span className="font-medium">{event._count?.registrations || 0}</span>
                        <span className="text-gray-500"> / {event.maxParticipants}</span>
                      </td>
                      <td className="px-6 py-4 text-gray-300">
                        {event.prizePool ? `$${event.prizePool.toLocaleString()}` : '-'}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <Link
                            href={`/admin/events/${event.id}`}
                            className="text-cyan-400 hover:text-cyan-300 font-medium text-sm"
                          >
                            Dashboard
                          </Link>
                          <Link
                            href={`/admin/events/${event.id}/checkin`}
                            className="text-green-400 hover:text-green-300 font-medium text-sm"
                          >
                            Check-In
                          </Link>
                          <Link
                            href={`/events/${event.id}`}
                            className="text-purple-400 hover:text-purple-300 font-medium text-sm"
                          >
                            View
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Stats Summary */}
        {events.length > 0 && (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-midnight-800 rounded-lg p-4 border border-cyan-500/20">
              <div className="text-gray-400 text-sm">Total Events</div>
              <div className="text-2xl font-bold text-cyan-400">{events.length}</div>
            </div>
            <div className="bg-midnight-800 rounded-lg p-4 border border-green-500/20">
              <div className="text-gray-400 text-sm">Open for Registration</div>
              <div className="text-2xl font-bold text-green-400">
                {events.filter(e => e.status === 'REGISTRATION_OPEN').length}
              </div>
            </div>
            <div className="bg-midnight-800 rounded-lg p-4 border border-blue-500/20">
              <div className="text-gray-400 text-sm">In Progress</div>
              <div className="text-2xl font-bold text-blue-400">
                {events.filter(e => e.status === 'IN_PROGRESS').length}
              </div>
            </div>
            <div className="bg-midnight-800 rounded-lg p-4 border border-purple-500/20">
              <div className="text-gray-400 text-sm">Completed</div>
              <div className="text-2xl font-bold text-purple-400">
                {events.filter(e => e.status === 'COMPLETED').length}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
