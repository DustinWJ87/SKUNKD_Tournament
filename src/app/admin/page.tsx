'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface DashboardStats {
  totalUsers: number
  totalEvents: number
  totalRegistrations: number
  totalRevenue: number
  upcomingEvents: number
  activeRegistrations: number
  recentUsers: number
  pendingApprovals: number
}

interface RecentActivity {
  type: 'registration' | 'event' | 'user'
  message: string
  timestamp: string
}

export default function AdminPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'loading') return

    if (!session?.user) {
      router.push('/auth/signin')
    } else if (session.user.role !== 'ADMIN' && session.user.role !== 'ORGANIZER') {
      router.push('/')
    } else {
      fetchDashboardStats()
    }
  }, [session, status, router])

  const fetchDashboardStats = async () => {
    try {
      // Fetch various stats
      const [eventsRes, registrationsRes, usersRes] = await Promise.all([
        fetch('/api/events?all=true'),
        fetch('/api/admin/registrations'),
        fetch('/api/admin/users'),
      ])

      const events = eventsRes.ok ? (await eventsRes.json()).events || [] : []
      const registrations = registrationsRes.ok ? await registrationsRes.json() : []
      const users = usersRes.ok ? await usersRes.json() : []

      const now = new Date()
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

      const dashboardStats: DashboardStats = {
        totalUsers: users.length,
        totalEvents: events.length,
        totalRegistrations: registrations.length,
        totalRevenue: registrations
          .filter((r: any) => r.paymentStatus === 'PAID')
          .reduce((sum: number, r: any) => sum + (r.paymentAmount || r.event.entryFee), 0),
        upcomingEvents: events.filter((e: any) => new Date(e.startDate) > now).length,
        activeRegistrations: registrations.filter((r: any) => r.status === 'APPROVED').length,
        recentUsers: users.filter((u: any) => new Date(u.createdAt) > weekAgo).length,
        pendingApprovals: registrations.filter((r: any) => r.status === 'PENDING').length,
      }

      setStats(dashboardStats)
    } catch (error) {
      console.error('Error fetching dashboard stats:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading || !stats) {
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
          <h1 className="text-3xl sm:text-4xl font-bold text-cyan-400 mb-2">Admin Dashboard</h1>
          <p className="text-gray-400 text-sm sm:text-base">Platform overview and analytics</p>
        </div>

        {/* Main Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Link
            href="/admin/users"
            className="bg-midnight-800 rounded-lg p-6 border border-cyan-500/20 hover:border-cyan-500/50 transition-all hover:scale-105"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="text-3xl">👥</div>
              <div className="text-3xl font-bold text-cyan-400">{stats.totalUsers}</div>
            </div>
            <div className="text-gray-400 text-sm">Total Users</div>
            {stats.recentUsers > 0 && (
              <div className="text-green-400 text-xs mt-1">
                +{stats.recentUsers} this week
              </div>
            )}
          </Link>

          <Link
            href="/admin/events"
            className="bg-midnight-800 rounded-lg p-6 border border-cyan-500/20 hover:border-cyan-500/50 transition-all hover:scale-105"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="text-3xl">🎮</div>
              <div className="text-3xl font-bold text-cyan-400">{stats.totalEvents}</div>
            </div>
            <div className="text-gray-400 text-sm">Total Events</div>
            {stats.upcomingEvents > 0 && (
              <div className="text-blue-400 text-xs mt-1">
                {stats.upcomingEvents} upcoming
              </div>
            )}
          </Link>

          <Link
            href="/admin/registrations"
            className="bg-midnight-800 rounded-lg p-6 border border-cyan-500/20 hover:border-cyan-500/50 transition-all hover:scale-105"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="text-3xl">📝</div>
              <div className="text-3xl font-bold text-cyan-400">{stats.totalRegistrations}</div>
            </div>
            <div className="text-gray-400 text-sm">Total Registrations</div>
            {stats.activeRegistrations > 0 && (
              <div className="text-green-400 text-xs mt-1">
                {stats.activeRegistrations} active
              </div>
            )}
          </Link>

          <div className="bg-midnight-800 rounded-lg p-6 border border-cyan-500/20">
            <div className="flex items-center justify-between mb-3">
              <div className="text-3xl">💰</div>
              <div className="text-3xl font-bold text-cyan-400">${stats.totalRevenue.toFixed(0)}</div>
            </div>
            <div className="text-gray-400 text-sm">Total Revenue</div>
            <div className="text-green-400 text-xs mt-1">
              From paid entries
            </div>
          </div>
        </div>

        {/* Secondary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-midnight-800 rounded-lg p-6 border border-blue-500/20">
            <div className="flex items-center justify-between mb-3">
              <div className="text-gray-400">Upcoming Events</div>
              <div className="text-2xl font-bold text-blue-400">{stats.upcomingEvents}</div>
            </div>
            <div className="h-2 bg-midnight-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500"
                style={{
                  width: `${Math.min((stats.upcomingEvents / stats.totalEvents) * 100, 100)}%`,
                }}
              ></div>
            </div>
          </div>

          <Link
            href="/admin/registrations?status=PENDING"
            className="bg-midnight-800 rounded-lg p-6 border border-yellow-500/20 hover:border-yellow-500/50 transition-all"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="text-gray-400">Pending Approvals</div>
              <div className="text-2xl font-bold text-yellow-400">{stats.pendingApprovals}</div>
            </div>
            {stats.pendingApprovals > 0 && (
              <div className="text-yellow-400 text-sm">⚠️ Needs attention</div>
            )}
          </Link>

          <div className="bg-midnight-800 rounded-lg p-6 border border-green-500/20">
            <div className="flex items-center justify-between mb-3">
              <div className="text-gray-400">Active Registrations</div>
              <div className="text-2xl font-bold text-green-400">{stats.activeRegistrations}</div>
            </div>
            <div className="h-2 bg-midnight-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-green-500"
                style={{
                  width: `${Math.min((stats.activeRegistrations / stats.totalRegistrations) * 100, 100)}%`,
                }}
              ></div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-midnight-800 rounded-lg p-6 border border-cyan-500/20">
          <h2 className="text-xl font-bold text-cyan-400 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link
              href="/admin/events/create"
              className="bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 px-6 py-3 rounded-lg text-center transition-all text-white font-semibold"
            >
              ➕ Create Event
            </Link>
            <Link
              href="/admin/registrations?status=PENDING"
              className="bg-yellow-600 hover:bg-yellow-700 px-6 py-3 rounded-lg text-center transition-colors text-white font-semibold"
            >
              ✓ Review Registrations
            </Link>
            <Link
              href="/admin/users"
              className="bg-cyan-600 hover:bg-cyan-700 px-6 py-3 rounded-lg text-center transition-colors text-white font-semibold"
            >
              👤 Manage Users
            </Link>
            <Link
              href="/admin/events"
              className="bg-green-600 hover:bg-green-700 px-6 py-3 rounded-lg text-center transition-colors text-white font-semibold"
            >
              📊 View Events
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
