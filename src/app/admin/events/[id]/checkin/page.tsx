"use client"

import { useSession } from "next-auth/react"
import { useRouter, useParams } from "next/navigation"
import { useEffect, useState } from "react"
import Link from "next/link"

interface Registration {
  id: string
  status: string
  checkInStatus: string
  paymentStatus: string
  registeredAt: string
  user: {
    id: string
    username: string
    name: string | null
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
    row: string
    number: number
    label: string
    type: string
  } | null
}

interface Event {
  id: string
  name: string
  game: string
  startDate: string
  endDate: string | null
  venue: string | null
  isOnline: boolean
  status: string
  maxParticipants: number
}

export default function CheckInPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const params = useParams()
  const eventId = params.id as string

  const [event, setEvent] = useState<Event | null>(null)
  const [registrations, setRegistrations] = useState<Registration[]>([])
  const [filteredRegistrations, setFilteredRegistrations] = useState<Registration[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("APPROVED")
  const [checkInFilter, setCheckInFilter] = useState<string>("ALL")

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
      fetchEvent()
      fetchRegistrations()
    }
  }, [session, eventId])

  useEffect(() => {
    // Apply filters
    let filtered = registrations

    if (searchQuery) {
      filtered = filtered.filter(
        (r) =>
          r.user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
          r.user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
          r.user.gamerTag?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          r.seat?.label.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    if (statusFilter !== "ALL") {
      filtered = filtered.filter((r) => r.status === statusFilter)
    }

    if (checkInFilter !== "ALL") {
      filtered = filtered.filter((r) => r.checkInStatus === checkInFilter)
    }

    setFilteredRegistrations(filtered)
  }, [searchQuery, statusFilter, checkInFilter, registrations])

  const fetchEvent = async () => {
    try {
      const response = await fetch(`/api/events/${eventId}`)
      if (response.ok) {
        const data = await response.json()
        setEvent(data)
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
        setFilteredRegistrations(data)
      }
    } catch (error) {
      console.error("Error fetching registrations:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleCheckIn = async (registrationId: string, checkInStatus: string) => {
    try {
      setUpdating(registrationId)
      const response = await fetch(`/api/registrations/${registrationId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ checkInStatus }),
      })

      if (response.ok) {
        await fetchRegistrations()
      } else {
        const data = await response.json()
        alert(data.error || "Failed to update check-in status")
      }
    } catch (error) {
      console.error("Error updating check-in:", error)
      alert("Failed to update check-in status")
    } finally {
      setUpdating(null)
    }
  }

  const handleBulkCheckIn = async () => {
    if (!confirm(`Check in all ${filteredRegistrations.filter(r => r.checkInStatus === 'NOT_CHECKED_IN').length} participants shown in current filter?`)) {
      return
    }

    const notCheckedIn = filteredRegistrations.filter(r => r.checkInStatus === 'NOT_CHECKED_IN')
    
    try {
      for (const reg of notCheckedIn) {
        await fetch(`/api/registrations/${reg.id}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ checkInStatus: "CHECKED_IN" }),
        })
      }
      
      await fetchRegistrations()
      alert(`Successfully checked in ${notCheckedIn.length} participants!`)
    } catch (error) {
      console.error("Error bulk checking in:", error)
      alert("Failed to complete bulk check-in")
    }
  }

  const stats = {
    total: registrations.filter(r => r.status === "APPROVED").length,
    checkedIn: registrations.filter(r => r.checkInStatus === "CHECKED_IN").length,
    notCheckedIn: registrations.filter(r => r.status === "APPROVED" && r.checkInStatus === "NOT_CHECKED_IN").length,
    noShow: registrations.filter(r => r.checkInStatus === "NO_SHOW").length,
    checkedInPercent: registrations.filter(r => r.status === "APPROVED").length > 0
      ? Math.round((registrations.filter(r => r.checkInStatus === "CHECKED_IN").length / registrations.filter(r => r.status === "APPROVED").length) * 100)
      : 0,
  }

  const getCheckInBadge = (status: string) => {
    const styles = {
      CHECKED_IN: "bg-green-500/20 text-green-400 border-green-500/30",
      NOT_CHECKED_IN: "bg-gray-500/20 text-gray-400 border-gray-500/30",
      NO_SHOW: "bg-red-500/20 text-red-400 border-red-500/30",
    }
    return styles[status as keyof typeof styles] || "bg-gray-500/20 text-gray-400 border-gray-500/30"
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-900 via-gray-900 to-black text-white">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-2">
            <Link
              href={`/events/${eventId}`}
              className="text-purple-400 hover:text-purple-300"
            >
              ← Back to Event
            </Link>
          </div>
          <h1 className="text-4xl font-bold mb-2">Event Check-In</h1>
          <h2 className="text-2xl text-gray-400">{event.name}</h2>
          <p className="text-gray-500">
            {event.game} • {new Date(event.startDate).toLocaleDateString()} • {event.venue || "Online"}
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/20 rounded-lg p-6 border border-purple-500/30">
            <div className="text-3xl font-bold mb-1">{stats.total}</div>
            <div className="text-gray-400 text-sm">Total Approved</div>
          </div>
          <div className="bg-gradient-to-br from-green-500/20 to-green-600/20 rounded-lg p-6 border border-green-500/30">
            <div className="text-3xl font-bold mb-1">{stats.checkedIn}</div>
            <div className="text-gray-400 text-sm">Checked In</div>
          </div>
          <div className="bg-gradient-to-br from-yellow-500/20 to-yellow-600/20 rounded-lg p-6 border border-yellow-500/30">
            <div className="text-3xl font-bold mb-1">{stats.notCheckedIn}</div>
            <div className="text-gray-400 text-sm">Pending Check-In</div>
          </div>
          <div className="bg-gradient-to-br from-red-500/20 to-red-600/20 rounded-lg p-6 border border-red-500/30">
            <div className="text-3xl font-bold mb-1">{stats.noShow}</div>
            <div className="text-gray-400 text-sm">No Show</div>
          </div>
          <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 rounded-lg p-6 border border-blue-500/30">
            <div className="text-3xl font-bold mb-1">{stats.checkedInPercent}%</div>
            <div className="text-gray-400 text-sm">Attendance Rate</div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-2">Search</label>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, email, seat..."
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:border-purple-500"
                autoFocus
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Registration Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:border-purple-500"
              >
                <option value="ALL">All Registrations</option>
                <option value="APPROVED">Approved Only</option>
                <option value="PENDING">Pending</option>
                <option value="WAITLIST">Waitlist</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Check-In Status</label>
              <select
                value={checkInFilter}
                onChange={(e) => setCheckInFilter(e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:border-purple-500"
              >
                <option value="ALL">All</option>
                <option value="NOT_CHECKED_IN">Not Checked In</option>
                <option value="CHECKED_IN">Checked In</option>
                <option value="NO_SHOW">No Show</option>
              </select>
            </div>
          </div>
          
          {/* Bulk Actions */}
          <div className="mt-4 flex gap-4">
            <button
              onClick={handleBulkCheckIn}
              disabled={filteredRegistrations.filter(r => r.checkInStatus === 'NOT_CHECKED_IN').length === 0}
              className="bg-green-600 hover:bg-green-700 px-6 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Bulk Check-In ({filteredRegistrations.filter(r => r.checkInStatus === 'NOT_CHECKED_IN').length})
            </button>
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-4 text-gray-400">
          Showing {filteredRegistrations.length} of {registrations.length} registrations
        </div>

        {/* Check-In List */}
        <div className="space-y-3">
          {filteredRegistrations.length === 0 ? (
            <div className="bg-gray-800/50 rounded-lg p-8 text-center border border-gray-700">
              <p className="text-gray-400">No registrations found</p>
            </div>
          ) : (
            filteredRegistrations.map((reg) => (
              <div
                key={reg.id}
                className={`bg-gray-800/50 rounded-lg p-6 border transition-all ${
                  reg.checkInStatus === "CHECKED_IN"
                    ? "border-green-500/30 bg-green-500/5"
                    : reg.checkInStatus === "NO_SHOW"
                    ? "border-red-500/30 bg-red-500/5"
                    : "border-gray-700 hover:border-purple-500/50"
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-start gap-4">
                      {/* User Avatar */}
                      <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-700 rounded-full flex items-center justify-center text-xl font-bold flex-shrink-0">
                        {reg.user.username[0].toUpperCase()}
                      </div>

                      {/* User Info */}
                      <div className="flex-1">
                        <div className="font-semibold text-lg">{reg.user.username}</div>
                        {reg.user.gamerTag && (
                          <div className="text-purple-400">@{reg.user.gamerTag}</div>
                        )}
                        {reg.user.name && (
                          <div className="text-gray-400 text-sm">{reg.user.name}</div>
                        )}
                        <div className="text-gray-500 text-sm">{reg.user.email}</div>

                        {/* Additional Info */}
                        <div className="flex flex-wrap gap-3 mt-3">
                          {reg.seat && (
                            <div className="flex items-center gap-2 bg-gray-700/50 px-3 py-1 rounded-full text-sm">
                              <span>💺</span>
                              <span className="font-medium">{reg.seat.label}</span>
                              {reg.seat.type === "VIP" && (
                                <span className="text-yellow-400">⭐</span>
                              )}
                            </div>
                          )}
                          {reg.team && (
                            <div className="flex items-center gap-2 bg-blue-600/20 px-3 py-1 rounded-full text-sm border border-blue-500/30">
                              <span>👥</span>
                              <span>
                                {reg.team.name}
                                {reg.team.tag && ` [${reg.team.tag}]`}
                              </span>
                            </div>
                          )}
                          {reg.status !== "APPROVED" && (
                            <div className="bg-yellow-500/20 px-3 py-1 rounded-full text-sm text-yellow-400 border border-yellow-500/30">
                              {reg.status}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Check-In Actions */}
                  <div className="flex flex-col gap-2 min-w-[180px]">
                    <div className={`text-center px-4 py-2 rounded-lg border font-semibold ${getCheckInBadge(reg.checkInStatus)}`}>
                      {reg.checkInStatus === "CHECKED_IN" && "✓ Checked In"}
                      {reg.checkInStatus === "NOT_CHECKED_IN" && "Not Checked In"}
                      {reg.checkInStatus === "NO_SHOW" && "✗ No Show"}
                    </div>

                    {reg.checkInStatus === "NOT_CHECKED_IN" && (
                      <button
                        onClick={() => handleCheckIn(reg.id, "CHECKED_IN")}
                        disabled={updating === reg.id}
                        className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg transition-colors disabled:opacity-50 font-semibold"
                      >
                        {updating === reg.id ? "Updating..." : "Check In"}
                      </button>
                    )}

                    {reg.checkInStatus === "CHECKED_IN" && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleCheckIn(reg.id, "NOT_CHECKED_IN")}
                          disabled={updating === reg.id}
                          className="flex-1 bg-gray-600 hover:bg-gray-700 px-3 py-1 rounded text-sm transition-colors disabled:opacity-50"
                        >
                          Undo
                        </button>
                        <button
                          onClick={() => handleCheckIn(reg.id, "NO_SHOW")}
                          disabled={updating === reg.id}
                          className="flex-1 bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-sm transition-colors disabled:opacity-50"
                        >
                          No Show
                        </button>
                      </div>
                    )}

                    {reg.checkInStatus === "NO_SHOW" && (
                      <button
                        onClick={() => handleCheckIn(reg.id, "NOT_CHECKED_IN")}
                        disabled={updating === reg.id}
                        className="bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
                      >
                        Reset
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
