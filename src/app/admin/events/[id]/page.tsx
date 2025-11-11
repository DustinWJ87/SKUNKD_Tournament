"use client"

import { useSession } from "next-auth/react"
import { useRouter, useParams } from "next/navigation"
import { useEffect, useState } from "react"
import Link from "next/link"

interface Event {
  id: string
  name: string
  description: string | null
  game: string
  startDate: string
  endDate: string | null
  registrationStart: string
  registrationEnd: string
  maxParticipants: number
  teamSize: number
  status: string
  venue: string | null
  venueAddress: string | null
  isOnline: boolean
  entryFee: number
  prizePool: number | null
  bannerImage: string | null
  thumbnailImage: string | null
  createdAt: string
  _count?: {
    registrations: number
    seats: number
  }
}

interface Registration {
  id: string
  status: string
  checkInStatus: string
  paymentStatus: string
  registeredAt: string
  user: {
    id: string
    username: string
    email: string
    gamerTag: string | null
  }
  team: {
    id: string
    name: string
    tag: string | null
  } | null
  seat: {
    id: string
    label: string
    type: string
  } | null
}

export default function AdminEventDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const params = useParams()
  const eventId = params.id as string

  const [event, setEvent] = useState<Event | null>(null)
  const [registrations, setRegistrations] = useState<Registration[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin")
    } else if (session?.user) {
      const user = session.user as any
      if (user.role !== "ADMIN" && user.role !== "ORGANIZER") {
        router.push("/")
      }
    }
  }, [status, session, router])

  useEffect(() => {
    if (session?.user && eventId) {
      fetchEventDetails()
      fetchRegistrations()
    }
  }, [session, eventId])

  const fetchEventDetails = async () => {
    try {
      const response = await fetch(`/api/events/${eventId}`)
      if (response.ok) {
        const data = await response.json()
        setEvent(data.event)
      }
    } catch (error) {
      console.error("Error fetching event:", error)
    }
  }

  const fetchRegistrations = async () => {
    try {
      const response = await fetch(`/api/admin/registrations?eventId=${eventId}`)
      if (response.ok) {
        const data = await response.json()
        setRegistrations(data)
      }
    } catch (error) {
      console.error("Error fetching registrations:", error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getStatusColor = (status: string) => {
    const colors = {
      DRAFT: "bg-gray-500",
      REGISTRATION_OPEN: "bg-green-500",
      REGISTRATION_CLOSED: "bg-yellow-500",
      IN_PROGRESS: "bg-blue-500",
      COMPLETED: "bg-purple-500",
      CANCELLED: "bg-red-500",
      POSTPONED: "bg-orange-500",
    }
    return colors[status as keyof typeof colors] || "bg-gray-500"
  }

  if (loading || !event) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-900 via-gray-900 to-black text-white">
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-700 rounded w-1/4 mb-8"></div>
            <div className="space-y-4">
              <div className="h-32 bg-gray-700 rounded"></div>
              <div className="h-32 bg-gray-700 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const approvedCount = registrations.filter((r) => r.status === "APPROVED").length
  
  const stats = {
    totalRegistrations: registrations.length,
    approved: approvedCount,
    pending: registrations.filter((r) => r.status === "PENDING").length,
    cancelled: registrations.filter((r) => r.status === "CANCELLED").length,
    checkedIn: registrations.filter((r) => r.checkInStatus === "CHECKED_IN").length,
    paid: registrations.filter((r) => r.paymentStatus === "PAID").length,
    revenue: registrations
      .filter((r) => r.paymentStatus === "PAID")
      .reduce((sum, r) => sum + event.entryFee, 0),
    seatsAvailable: (event._count?.seats || 0) - registrations.filter((r) => r.seat && r.status !== "CANCELLED").length,
    capacityUsed: Math.round((approvedCount / event.maxParticipants) * 100),
  }

  const now = new Date()
  const isUpcoming = new Date(event.startDate) > now
  const isInProgress = event.status === "IN_PROGRESS"
  const isCompleted = event.status === "COMPLETED"

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-900 via-gray-900 to-black text-white">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Link
              href="/admin/events"
              className="text-purple-400 hover:text-purple-300"
            >
              ← Back to Events
            </Link>
          </div>
          
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div className="flex-1">
              <h1 className="text-4xl font-bold mb-2">{event.name}</h1>
              <div className="flex flex-wrap gap-3 items-center text-gray-400">
                <span className="flex items-center gap-2">
                  🎮 {event.game}
                </span>
                <span className="flex items-center gap-2">
                  📅 {formatDate(event.startDate)}
                </span>
                <span className="flex items-center gap-2">
                  {event.isOnline ? "🌐 Online" : `📍 ${event.venue}`}
                </span>
                <span className={`${getStatusColor(event.status)} px-3 py-1 rounded-full text-white text-sm font-medium`}>
                  {event.status.replace(/_/g, " ")}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Link
                href={`/admin/events/${eventId}/brackets`}
                className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition-colors"
              >
                🏆 Brackets
              </Link>
              <Link
                href={`/admin/events/${eventId}/checkin`}
                className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg transition-colors"
              >
                Check-In
              </Link>
              <Link
                href={`/events/${eventId}`}
                className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg transition-colors"
              >
                View Public Page
              </Link>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
          <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/20 rounded-lg p-4 border border-purple-500/30">
            <div className="text-2xl font-bold mb-1">{stats.totalRegistrations}</div>
            <div className="text-gray-400 text-xs">Total Registrations</div>
          </div>
          <div className="bg-gradient-to-br from-green-500/20 to-green-600/20 rounded-lg p-4 border border-green-500/30">
            <div className="text-2xl font-bold mb-1">{stats.approved}</div>
            <div className="text-gray-400 text-xs">Approved</div>
          </div>
          <div className="bg-gradient-to-br from-yellow-500/20 to-yellow-600/20 rounded-lg p-4 border border-yellow-500/30">
            <div className="text-2xl font-bold mb-1">{stats.pending}</div>
            <div className="text-gray-400 text-xs">Pending</div>
          </div>
          <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 rounded-lg p-4 border border-blue-500/30">
            <div className="text-2xl font-bold mb-1">{stats.checkedIn}</div>
            <div className="text-gray-400 text-xs">Checked In</div>
          </div>
          <div className="bg-gradient-to-br from-cyan-500/20 to-cyan-600/20 rounded-lg p-4 border border-cyan-500/30">
            <div className="text-2xl font-bold mb-1">{stats.seatsAvailable}</div>
            <div className="text-gray-400 text-xs">Seats Available</div>
          </div>
          <div className="bg-gradient-to-br from-emerald-500/20 to-emerald-600/20 rounded-lg p-4 border border-emerald-500/30">
            <div className="text-2xl font-bold mb-1">${stats.revenue}</div>
            <div className="text-gray-400 text-xs">Revenue</div>
          </div>
        </div>

        {/* Event Details & Capacity */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Event Information */}
          <div className="lg:col-span-2 bg-gray-800/50 rounded-lg p-6 border border-gray-700">
            <h2 className="text-xl font-bold mb-4">Event Details</h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Description:</span>
                <span className="text-right max-w-md">{event.description || "No description"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Registration Period:</span>
                <span>{formatDate(event.registrationStart)} - {formatDate(event.registrationEnd)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Event Duration:</span>
                <span>
                  {formatDate(event.startDate)}
                  {event.endDate && ` - ${formatDate(event.endDate)}`}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Max Participants:</span>
                <span>{event.maxParticipants}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Team Size:</span>
                <span>{event.teamSize === 1 ? "Solo" : `${event.teamSize} players per team`}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Entry Fee:</span>
                <span className="font-semibold text-green-400">${event.entryFee}</span>
              </div>
              {event.prizePool && (
                <div className="flex justify-between">
                  <span className="text-gray-400">Prize Pool:</span>
                  <span className="font-semibold text-yellow-400">${event.prizePool.toLocaleString()}</span>
                </div>
              )}
              {!event.isOnline && event.venueAddress && (
                <div className="flex justify-between">
                  <span className="text-gray-400">Address:</span>
                  <span className="text-right max-w-md">{event.venueAddress}</span>
                </div>
              )}
            </div>
          </div>

          {/* Capacity Overview */}
          <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700">
            <h2 className="text-xl font-bold mb-4">Capacity</h2>
            <div className="text-center mb-4">
              <div className="text-4xl font-bold text-purple-400 mb-2">
                {stats.capacityUsed}%
              </div>
              <div className="text-gray-400 text-sm">Capacity Used</div>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-4 mb-4 overflow-hidden">
              <div
                className="bg-gradient-to-r from-purple-500 to-purple-600 h-full rounded-full transition-all"
                style={{ width: `${Math.min(stats.capacityUsed, 100)}%` }}
              ></div>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Approved:</span>
                <span className="font-semibold">{stats.approved} / {event.maxParticipants}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Available Spots:</span>
                <span className="font-semibold text-green-400">{event.maxParticipants - stats.approved}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Waitlist:</span>
                <span className="font-semibold text-yellow-400">
                  {registrations.filter((r) => r.status === "WAITLIST").length}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Payment & Check-in Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700">
            <h2 className="text-xl font-bold mb-4">Payment Status</h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Paid</span>
                <div className="flex items-center gap-3">
                  <div className="w-32 bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-green-500 h-full rounded-full"
                      style={{ width: `${(stats.paid / stats.totalRegistrations) * 100}%` }}
                    ></div>
                  </div>
                  <span className="font-semibold text-green-400 w-12 text-right">{stats.paid}</span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Unpaid</span>
                <div className="flex items-center gap-3">
                  <div className="w-32 bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-red-500 h-full rounded-full"
                      style={{
                        width: `${(registrations.filter((r) => r.paymentStatus === "UNPAID").length /
                          stats.totalRegistrations) *
                          100}%`,
                      }}
                    ></div>
                  </div>
                  <span className="font-semibold text-red-400 w-12 text-right">
                    {registrations.filter((r) => r.paymentStatus === "UNPAID").length}
                  </span>
                </div>
              </div>
              <div className="pt-3 border-t border-gray-700">
                <div className="flex justify-between text-lg">
                  <span className="font-semibold">Total Revenue:</span>
                  <span className="font-bold text-green-400">${stats.revenue}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-400 mt-1">
                  <span>Expected Total:</span>
                  <span>${stats.approved * event.entryFee}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700">
            <h2 className="text-xl font-bold mb-4">Check-In Status</h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Checked In</span>
                <div className="flex items-center gap-3">
                  <div className="w-32 bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-green-500 h-full rounded-full"
                      style={{ width: `${(stats.checkedIn / stats.approved) * 100}%` }}
                    ></div>
                  </div>
                  <span className="font-semibold text-green-400 w-12 text-right">{stats.checkedIn}</span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Not Checked In</span>
                <div className="flex items-center gap-3">
                  <div className="w-32 bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-gray-500 h-full rounded-full"
                      style={{
                        width: `${(registrations.filter((r) => r.checkInStatus === "NOT_CHECKED_IN" && r.status === "APPROVED").length /
                          stats.approved) *
                          100}%`,
                      }}
                    ></div>
                  </div>
                  <span className="font-semibold w-12 text-right">
                    {registrations.filter((r) => r.checkInStatus === "NOT_CHECKED_IN" && r.status === "APPROVED").length}
                  </span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">No Show</span>
                <div className="flex items-center gap-3">
                  <div className="w-32 bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-red-500 h-full rounded-full"
                      style={{
                        width: `${(registrations.filter((r) => r.checkInStatus === "NO_SHOW").length / stats.approved) * 100}%`,
                      }}
                    ></div>
                  </div>
                  <span className="font-semibold text-red-400 w-12 text-right">
                    {registrations.filter((r) => r.checkInStatus === "NO_SHOW").length}
                  </span>
                </div>
              </div>
              <div className="pt-3 border-t border-gray-700">
                <div className="flex justify-between text-lg">
                  <span className="font-semibold">Attendance Rate:</span>
                  <span className="font-bold text-blue-400">
                    {stats.approved > 0 ? Math.round((stats.checkedIn / stats.approved) * 100) : 0}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Registrations */}
        <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Recent Registrations</h2>
            <Link
              href={`/admin/registrations?eventId=${eventId}`}
              className="text-purple-400 hover:text-purple-300 text-sm"
            >
              View All →
            </Link>
          </div>
          
          {registrations.length === 0 ? (
            <p className="text-gray-400 text-center py-8">No registrations yet</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="text-xs text-gray-400 border-b border-gray-700">
                  <tr>
                    <th className="text-left py-2">User</th>
                    <th className="text-left py-2">Seat</th>
                    <th className="text-left py-2">Status</th>
                    <th className="text-left py-2">Payment</th>
                    <th className="text-left py-2">Check-In</th>
                    <th className="text-left py-2">Registered</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {registrations.slice(0, 10).map((reg) => (
                    <tr key={reg.id} className="border-b border-gray-700/50 hover:bg-gray-700/30">
                      <td className="py-3">
                        <div>
                          <div className="font-medium">{reg.user.username}</div>
                          {reg.user.gamerTag && (
                            <div className="text-xs text-gray-400">@{reg.user.gamerTag}</div>
                          )}
                        </div>
                      </td>
                      <td className="py-3">
                        {reg.seat ? (
                          <span className="text-purple-400">{reg.seat.label}</span>
                        ) : (
                          <span className="text-gray-500">-</span>
                        )}
                      </td>
                      <td className="py-3">
                        <span className={`text-xs px-2 py-1 rounded ${
                          reg.status === "APPROVED" ? "bg-green-500/20 text-green-400" :
                          reg.status === "PENDING" ? "bg-yellow-500/20 text-yellow-400" :
                          "bg-gray-500/20 text-gray-400"
                        }`}>
                          {reg.status}
                        </span>
                      </td>
                      <td className="py-3">
                        <span className={`text-xs px-2 py-1 rounded ${
                          reg.paymentStatus === "PAID" ? "bg-green-500/20 text-green-400" :
                          "bg-red-500/20 text-red-400"
                        }`}>
                          {reg.paymentStatus}
                        </span>
                      </td>
                      <td className="py-3">
                        <span className={`text-xs px-2 py-1 rounded ${
                          reg.checkInStatus === "CHECKED_IN" ? "bg-green-500/20 text-green-400" :
                          reg.checkInStatus === "NO_SHOW" ? "bg-red-500/20 text-red-400" :
                          "bg-gray-500/20 text-gray-400"
                        }`}>
                          {reg.checkInStatus.replace(/_/g, " ")}
                        </span>
                      </td>
                      <td className="py-3 text-gray-400 text-xs">
                        {new Date(reg.registeredAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
