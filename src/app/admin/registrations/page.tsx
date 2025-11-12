"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import Link from "next/link"

interface Registration {
  id: string
  status: string
  checkInStatus: string
  paymentStatus: string
  paymentAmount: number | null
  registeredAt: string
  event: {
    id: string
    name: string
    game: string
    startDate: string
    endDate: string | null
    venue: string | null
    isOnline: boolean
    status: string
    entryFee: number
  }
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

export default function AdminRegistrationsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [registrations, setRegistrations] = useState<Registration[]>([])
  const [filteredRegistrations, setFilteredRegistrations] = useState<Registration[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)

  // Filters
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("ALL")
  const [paymentFilter, setPaymentFilter] = useState<string>("ALL")
  const [eventFilter, setEventFilter] = useState<string>("ALL")

  // Get unique events for filter
  const uniqueEvents = Array.from(
    new Set(registrations.map((r) => JSON.stringify({ id: r.event.id, name: r.event.name })))
  ).map((e) => JSON.parse(e))

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin")
    } else if (session?.user) {
      const user = session.user as any
      if (user.role !== "ADMIN") {
        router.push("/")
      }
    }
  }, [status, session, router])

  useEffect(() => {
    if (session?.user) {
      fetchRegistrations()
    }
  }, [session])

  useEffect(() => {
    // Apply filters
    let filtered = registrations

    if (searchQuery) {
      filtered = filtered.filter(
        (r) =>
          r.user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
          r.user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
          r.user.gamerTag?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          r.event.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    if (statusFilter !== "ALL") {
      filtered = filtered.filter((r) => r.status === statusFilter)
    }

    if (paymentFilter !== "ALL") {
      filtered = filtered.filter((r) => r.paymentStatus === paymentFilter)
    }

    if (eventFilter !== "ALL") {
      filtered = filtered.filter((r) => r.event.id === eventFilter)
    }

    setFilteredRegistrations(filtered)
  }, [searchQuery, statusFilter, paymentFilter, eventFilter, registrations])

  const fetchRegistrations = async () => {
    try {
      const response = await fetch("/api/admin/registrations")
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

  const handleUpdateStatus = async (
    registrationId: string,
    field: "status" | "paymentStatus" | "checkInStatus",
    value: string
  ) => {
    try {
      setUpdating(registrationId)
      const response = await fetch(`/api/registrations/${registrationId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ [field]: value }),
      })

      if (response.ok) {
        await fetchRegistrations()
      } else {
        const data = await response.json()
        alert(data.error || "Failed to update registration")
      }
    } catch (error) {
      console.error("Error updating registration:", error)
      alert("Failed to update registration")
    } finally {
      setUpdating(null)
    }
  }

  const getStatusBadge = (status: string) => {
    const styles = {
      APPROVED: "bg-green-500/20 text-green-400 border-green-500/30",
      PENDING: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
      REJECTED: "bg-red-500/20 text-red-400 border-red-500/30",
      WAITLIST: "bg-blue-500/20 text-blue-400 border-blue-500/30",
      CANCELLED: "bg-gray-500/20 text-gray-400 border-gray-500/30",
    }
    return styles[status as keyof typeof styles] || "bg-gray-500/20 text-gray-400 border-gray-500/30"
  }

  const getPaymentBadge = (status: string) => {
    const styles = {
      PAID: "bg-green-500/20 text-green-400 border-green-500/30",
      PENDING: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
      UNPAID: "bg-red-500/20 text-red-400 border-red-500/30",
      REFUNDED: "bg-gray-500/20 text-gray-400 border-gray-500/30",
    }
    return styles[status as keyof typeof styles] || "bg-gray-500/20 text-gray-400 border-gray-500/30"
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

  const stats = {
    total: registrations.length,
    pending: registrations.filter((r) => r.status === "PENDING").length,
    approved: registrations.filter((r) => r.status === "APPROVED").length,
    revenue: registrations
      .filter((r) => r.paymentStatus === "PAID")
      .reduce((sum, r) => sum + (r.paymentAmount || r.event.entryFee), 0),
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-midnight-900 flex items-center justify-center">
        <div className="text-cyan-400 text-xl">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-midnight-900 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-cyan-400 mb-2">Registration Management</h1>
          <p className="text-gray-400 text-sm sm:text-base">Manage all event registrations across the platform</p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-midnight-800 rounded-lg p-6 border border-cyan-500/20">
            <div className="text-3xl font-bold text-cyan-400 mb-1">{stats.total}</div>
            <div className="text-gray-400 text-sm">Total Registrations</div>
          </div>
          <div className="bg-midnight-800 rounded-lg p-6 border border-yellow-500/20">
            <div className="text-3xl font-bold text-yellow-400 mb-1">{stats.pending}</div>
            <div className="text-gray-400 text-sm">Pending Review</div>
          </div>
          <div className="bg-midnight-800 rounded-lg p-6 border border-green-500/20">
            <div className="text-3xl font-bold text-green-400 mb-1">{stats.approved}</div>
            <div className="text-gray-400 text-sm">Approved</div>
          </div>
          <div className="bg-midnight-800 rounded-lg p-6 border border-cyan-500/20">
            <div className="text-3xl font-bold text-cyan-400 mb-1">${stats.revenue.toFixed(2)}</div>
            <div className="text-gray-400 text-sm">Total Revenue</div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-midnight-800 rounded-lg p-6 border border-cyan-500/20 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Search</label>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search users or events..."
                className="w-full bg-midnight-900 border border-cyan-500/20 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full bg-midnight-900 border border-cyan-500/20 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-cyan-500"
              >
                <option value="ALL">All Statuses</option>
                <option value="PENDING">Pending</option>
                <option value="APPROVED">Approved</option>
                <option value="REJECTED">Rejected</option>
                <option value="WAITLIST">Waitlist</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Payment</label>
              <select
                value={paymentFilter}
                onChange={(e) => setPaymentFilter(e.target.value)}
                className="w-full bg-midnight-900 border border-cyan-500/20 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-cyan-500"
              >
                <option value="ALL">All Payments</option>
                <option value="PAID">Paid</option>
                <option value="PENDING">Pending</option>
                <option value="UNPAID">Unpaid</option>
                <option value="REFUNDED">Refunded</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Event</label>
              <select
                value={eventFilter}
                onChange={(e) => setEventFilter(e.target.value)}
                className="w-full bg-midnight-900 border border-cyan-500/20 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-cyan-500"
              >
                <option value="ALL">All Events</option>
                {uniqueEvents.map((event: any) => (
                  <option key={event.id} value={event.id}>
                    {event.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-4 text-gray-400">
          Showing {filteredRegistrations.length} of {registrations.length} registrations
        </div>

        {/* Registrations Table */}
        <div className="bg-midnight-800 rounded-lg border border-cyan-500/20 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-midnight-950 border-b border-cyan-500/20">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-cyan-400">
                    User
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-cyan-400">
                    Event
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-cyan-400">
                    Seat
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-cyan-400">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-cyan-400">
                    Payment
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-cyan-400">
                    Check-In
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-cyan-400">
                    Registered
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-cyan-400">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cyan-500/10">
                {filteredRegistrations.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-8 text-center text-gray-400">
                      No registrations found
                    </td>
                  </tr>
                ) : (
                  filteredRegistrations.map((reg) => (
                    <tr key={reg.id} className="hover:bg-midnight-700/50 transition-colors">
                      <td className="px-6 py-4">
                        <div>
                          <Link
                            href={`/profile/${reg.user.id}`}
                            className="font-medium text-white hover:text-cyan-400"
                          >
                            {reg.user.username}
                          </Link>
                          {reg.user.gamerTag && (
                            <div className="text-sm text-gray-400">@{reg.user.gamerTag}</div>
                          )}
                          <div className="text-xs text-gray-500">{reg.user.email}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <Link
                          href={`/events/${reg.event.id}`}
                          className="text-white hover:text-cyan-400"
                        >
                          {reg.event.name}
                        </Link>
                        <div className="text-sm text-gray-400">{reg.event.game}</div>
                        {reg.team && (
                          <div className="text-xs text-cyan-400">
                            Team: {reg.team.name}
                            {reg.team.tag && ` [${reg.team.tag}]`}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {reg.seat ? (
                          <div>
                            <div className="font-medium text-white">{reg.seat.label}</div>
                            {reg.seat.type === "VIP" && (
                              <span className="text-yellow-400 text-xs">⭐ VIP</span>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-500 text-sm">No seat</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <select
                          value={reg.status}
                          onChange={(e) =>
                            handleUpdateStatus(reg.id, "status", e.target.value)
                          }
                          disabled={updating === reg.id}
                          className={`text-xs px-3 py-1 rounded border ${getStatusBadge(
                            reg.status
                          )} bg-midnight-900 text-white focus:outline-none focus:border-cyan-500 disabled:opacity-50`}
                        >
                          <option value="PENDING">Pending</option>
                          <option value="APPROVED">Approved</option>
                          <option value="REJECTED">Rejected</option>
                          <option value="WAITLIST">Waitlist</option>
                          <option value="CANCELLED">Cancelled</option>
                        </select>
                      </td>
                      <td className="px-6 py-4">
                        <select
                          value={reg.paymentStatus}
                          onChange={(e) =>
                            handleUpdateStatus(reg.id, "paymentStatus", e.target.value)
                          }
                          disabled={updating === reg.id}
                          className={`text-xs px-3 py-1 rounded border ${getPaymentBadge(
                            reg.paymentStatus
                          )} bg-midnight-900 text-white focus:outline-none focus:border-cyan-500 disabled:opacity-50`}
                        >
                          <option value="UNPAID">Unpaid</option>
                          <option value="PENDING">Pending</option>
                          <option value="PAID">Paid</option>
                          <option value="REFUNDED">Refunded</option>
                        </select>
                        {reg.event.entryFee > 0 && (
                          <div className="text-xs text-gray-400 mt-1">
                            ${reg.event.entryFee}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <select
                          value={reg.checkInStatus}
                          onChange={(e) =>
                            handleUpdateStatus(reg.id, "checkInStatus", e.target.value)
                          }
                          disabled={updating === reg.id}
                          className="text-xs px-3 py-1 rounded bg-midnight-900 border border-cyan-500/20 text-white focus:outline-none focus:border-cyan-500 disabled:opacity-50"
                        >
                          <option value="NOT_CHECKED_IN">Not Checked In</option>
                          <option value="CHECKED_IN">Checked In</option>
                          <option value="NO_SHOW">No Show</option>
                        </select>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-300">
                        {formatDate(reg.registeredAt)}
                      </td>
                      <td className="px-6 py-4">
                        <Link
                          href={`/profile/${reg.user.id}`}
                          className="text-cyan-400 hover:text-cyan-300 text-sm font-medium"
                        >
                          View User
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
