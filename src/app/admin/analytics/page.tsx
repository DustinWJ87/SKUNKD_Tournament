"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"

interface AnalyticsData {
  revenue: {
    total: number
    refunds: number
    net: number
    byDay: Record<string, number>
    transactions: number
  }
  registrations: {
    total: number
    byStatus: Record<string, number>
    byDay: Record<string, number>
  }
  events: {
    total: number
    byStatus: Record<string, number>
    topEvents: Array<{
      id: string
      name: string
      game: string
      registrations: number
      revenue: number
    }>
  }
  users: {
    total: number
    new: number
    active: number
    byRole: Record<string, number>
  }
  timeRange: number
}

export default function AnalyticsPage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState("30")

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin")
    } else if (session?.user?.role !== "ADMIN" && session?.user?.role !== "ORGANIZER") {
      router.push("/admin")
    }
  }, [status, session, router])

  useEffect(() => {
    if (status === "authenticated") {
      fetchAnalytics()
    }
  }, [status, timeRange])

  async function fetchAnalytics() {
    try {
      setLoading(true)
      const res = await fetch(`/api/admin/analytics?timeRange=${timeRange}`)
      if (res.ok) {
        const data = await res.json()
        setAnalytics(data)
      }
    } catch (error) {
      console.error("Failed to fetch analytics:", error)
    } finally {
      setLoading(false)
    }
  }

  if (status === "loading" || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-midnight-900">
        <div className="text-lg text-cyan-400">Loading analytics...</div>
      </div>
    )
  }

  if (!analytics) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-midnight-900">
        <div className="text-lg text-red-400">Failed to load analytics</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-midnight-900 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 sm:gap-6 mb-8">
          <div className="flex-1 min-w-0">
            <h1 className="text-3xl sm:text-4xl font-bold text-cyan-400 mb-2">Analytics Dashboard</h1>
            <p className="text-gray-400 text-sm sm:text-base">Platform performance metrics</p>
          </div>
          <div className="flex gap-4 items-center">
            <label className="text-sm font-medium text-gray-400 whitespace-nowrap">Time Range:</label>
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="bg-midnight-800 border border-cyan-500/20 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-cyan-500"
            >
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
              <option value="365">Last year</option>
            </select>
          </div>
        </div>

      {/* Revenue Section */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4 text-cyan-400">Revenue</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Revenue"
            value={`$${analytics.revenue.total.toFixed(2)}`}
            description={`${analytics.revenue.transactions} transactions`}
          />
          <StatCard
            title="Total Refunds"
            value={`$${analytics.revenue.refunds.toFixed(2)}`}
            description="Refunded to users"
            negative
          />
          <StatCard
            title="Net Revenue"
            value={`$${analytics.revenue.net.toFixed(2)}`}
            description="After refunds"
            highlight
          />
          <StatCard
            title="Avg Transaction"
            value={`$${(analytics.revenue.total / (analytics.revenue.transactions || 1)).toFixed(2)}`}
            description="Per registration"
          />
        </div>

        {/* Revenue Chart */}
        <div className="mt-6 bg-midnight-800 rounded-lg border border-cyan-500/20 p-6">
          <h3 className="text-lg font-semibold mb-4 text-cyan-400">Revenue Trend</h3>
          <div className="space-y-2">
            {Object.entries(analytics.revenue.byDay)
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([date, amount]) => (
                <div key={date} className="flex items-center gap-4">
                  <div className="w-32 text-sm text-gray-400">{date}</div>
                  <div className="flex-1 bg-midnight-950 rounded h-6 relative">
                    <div
                      className="bg-gradient-to-r from-cyan-500 to-blue-500 h-full rounded"
                      style={{
                        width: `${(amount / Math.max(...Object.values(analytics.revenue.byDay))) * 100}%`,
                      }}
                    />
                  </div>
                  <div className="w-24 text-right font-medium text-white">${amount.toFixed(2)}</div>
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* Registrations Section */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4 text-cyan-400">Registrations</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Registrations"
            value={analytics.registrations.total.toString()}
            description={`Last ${timeRange} days`}
          />
          <StatCard
            title="Approved"
            value={(analytics.registrations.byStatus.APPROVED || 0).toString()}
            description="Ready to participate"
          />
          <StatCard
            title="Pending"
            value={(analytics.registrations.byStatus.PENDING || 0).toString()}
            description="Awaiting approval"
          />
          <StatCard
            title="Cancelled"
            value={(analytics.registrations.byStatus.CANCELLED || 0).toString()}
            description="User cancelled"
            negative
          />
        </div>

        {/* Registration Status Breakdown */}
        <div className="mt-6 bg-midnight-800 rounded-lg border border-cyan-500/20 p-6">
          <h3 className="text-lg font-semibold mb-4 text-cyan-400">Registration Status</h3>
          <div className="space-y-3">
            {Object.entries(analytics.registrations.byStatus).map(([status, count]) => (
              <div key={status} className="flex items-center gap-4">
                <div className="w-32 text-sm capitalize text-gray-400">{status.toLowerCase().replace("_", " ")}</div>
                <div className="flex-1 bg-midnight-950 rounded h-6 relative">
                  <div
                    className={`h-full rounded ${
                      status === "APPROVED"
                        ? "bg-green-500"
                        : status === "PENDING"
                        ? "bg-yellow-500"
                        : status === "REJECTED"
                        ? "bg-red-500"
                        : "bg-gray-500"
                    }`}
                    style={{
                      width: `${(count / analytics.registrations.total) * 100}%`,
                    }}
                  />
                </div>
                <div className="w-24 text-right font-medium text-white">{count}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Events Section */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4 text-cyan-400">Events</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Events"
            value={analytics.events.total.toString()}
            description={`Created in last ${timeRange} days`}
          />
          <StatCard
            title="Published"
            value={(analytics.events.byStatus.PUBLISHED || 0).toString()}
            description="Live events"
          />
          <StatCard
            title="In Progress"
            value={(analytics.events.byStatus.IN_PROGRESS || 0).toString()}
            description="Currently running"
          />
          <StatCard
            title="Completed"
            value={(analytics.events.byStatus.COMPLETED || 0).toString()}
            description="Finished events"
          />
        </div>

        {/* Top Events */}
        <div className="mt-6 bg-midnight-800 rounded-lg border border-cyan-500/20 overflow-hidden">
          <h3 className="text-lg font-semibold p-6 pb-4 text-cyan-400">Top Events by Registrations</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-midnight-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Event</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Game</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase">Registrations</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase">Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cyan-500/20">
                {analytics.events.topEvents.map((event) => (
                  <tr key={event.id} className="hover:bg-midnight-700">
                    <td className="px-6 py-4">
                      <button
                        onClick={() => router.push(`/admin/events/${event.id}`)}
                        className="text-cyan-400 hover:underline"
                      >
                        {event.name}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-400">{event.game}</td>
                    <td className="px-6 py-4 text-right font-medium text-white">{event.registrations}</td>
                    <td className="px-6 py-4 text-right font-medium text-white">${event.revenue.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Users Section */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4 text-cyan-400">Users</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Users"
            value={analytics.users.total.toString()}
            description="All registered users"
          />
          <StatCard
            title="New Users"
            value={analytics.users.new.toString()}
            description={`Last ${timeRange} days`}
          />
          <StatCard
            title="Active Users"
            value={analytics.users.active.toString()}
            description="Recently participated"
          />
          <StatCard
            title="Admins"
            value={(analytics.users.byRole.ADMIN || 0).toString()}
            description="Platform administrators"
          />
        </div>

        {/* User Roles */}
        <div className="mt-6 bg-midnight-800 rounded-lg border border-cyan-500/20 p-6">
          <h3 className="text-lg font-semibold mb-4 text-cyan-400">User Roles Distribution</h3>
          <div className="space-y-3">
            {Object.entries(analytics.users.byRole).map(([role, count]) => (
              <div key={role} className="flex items-center gap-4">
                <div className="w-32 text-sm capitalize text-gray-400">{role.toLowerCase()}</div>
                <div className="flex-1 bg-midnight-950 rounded h-6 relative">
                  <div
                    className={`h-full rounded ${
                      role === "ADMIN" ? "bg-purple-500" : role === "ORGANIZER" ? "bg-blue-500" : "bg-gray-500"
                    }`}
                    style={{
                      width: `${(count / analytics.users.total) * 100}%`,
                    }}
                  />
                </div>
                <div className="w-24 text-right font-medium text-white">{count}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
    </div>
  )
}

function StatCard({
  title,
  value,
  description,
  highlight = false,
  negative = false,
}: {
  title: string
  value: string
  description: string
  highlight?: boolean
  negative?: boolean
}) {
  return (
    <div
      className={`bg-midnight-800 rounded-lg border p-6 ${
        highlight ? "border-cyan-500" : "border-cyan-500/20"
      }`}
    >
      <h3 className="text-sm font-medium text-gray-400 mb-2">{title}</h3>
      <p
        className={`text-3xl font-bold mb-1 ${
          highlight ? "text-cyan-400" : negative ? "text-red-400" : "text-white"
        }`}
      >
        {value}
      </p>
      <p className="text-sm text-gray-500">{description}</p>
    </div>
  )
}
