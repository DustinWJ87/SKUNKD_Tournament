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
    thumbnailImage: string | null
    entryFee: number
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

interface UserProfile {
  user: {
    id: string
    username: string
    name: string | null
    email: boolean
    gamerTag: string | null
    bio: string | null
    image: string | null
    role: string
    createdAt: string
  }
  stats: {
    totalEvents: number
    upcomingEvents: number
    completedEvents: number
    teamsJoined: number
    checkedInEvents: number
  }
  upcomingEvents: Registration[]
  pastEvents: Registration[]
  teams: any[]
}

export default function ProfilePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [cancelling, setCancelling] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    gamerTag: "",
    bio: "",
  })

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin")
    } else if (session?.user) {
      const user = session.user as any
      fetchProfile(user.id)
    }
  }, [status, session, router])

  const fetchProfile = async (userId: string) => {
    try {
      const response = await fetch(`/api/profile/${userId}`)
      if (response.ok) {
        const data = await response.json()
        setProfile(data)
        setFormData({
          name: data.user.name || "",
          gamerTag: data.user.gamerTag || "",
          bio: data.user.bio || "",
        })
      }
    } catch (error) {
      console.error("Error fetching profile:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const user = session?.user as any
    if (!user) return

    try {
      const response = await fetch(`/api/profile/${user.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        await fetchProfile(user.id)
        setEditing(false)
      } else {
        const data = await response.json()
        alert(data.error || "Failed to update profile")
      }
    } catch (error) {
      console.error("Error updating profile:", error)
      alert("Failed to update profile")
    }
  }

  const handleCancelRegistration = async (registrationId: string, eventName: string) => {
    if (!confirm(`Are you sure you want to cancel your registration for "${eventName}"?`)) {
      return
    }

    try {
      setCancelling(registrationId)
      const response = await fetch(`/api/registrations/${registrationId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        const user = session?.user as any
        await fetchProfile(user.id)
        alert('Registration cancelled successfully')
      } else {
        const data = await response.json()
        alert(data.error || 'Failed to cancel registration')
      }
    } catch (error) {
      console.error("Error cancelling registration:", error)
      alert('Failed to cancel registration')
    } finally {
      setCancelling(null)
    }
  }

  const canCancelRegistration = (registration: Registration) => {
    if (registration.status === 'CANCELLED') return false
    
    const now = new Date()
    const eventStart = new Date(registration.event.startDate)
    if (eventStart < now) return false
    
    if (registration.event.status === 'IN_PROGRESS' || registration.event.status === 'COMPLETED') return false
    
    return true
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

  if (loading || !profile) {
    return (
      <div className="min-h-screen bg-midnight-900 flex items-center justify-center">
        <div className="text-cyan-400 text-xl">Loading profile...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-midnight-900 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Profile Header */}
        <div className="bg-midnight-800 rounded-lg p-4 sm:p-8 border border-cyan-500/20 mb-8">
          <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-6">
            <div className="flex items-center gap-4 sm:gap-6 flex-1 min-w-0">
              <div className="w-16 h-16 sm:w-24 sm:h-24 bg-gradient-to-br from-cyan-500 to-purple-600 rounded-full flex items-center justify-center text-2xl sm:text-4xl font-bold text-white flex-shrink-0">
                {profile.user.username[0].toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-xl sm:text-3xl font-bold text-cyan-400 truncate">{profile.user.username}</h1>
                {profile.user.name && (
                  <p className="text-gray-400 text-base sm:text-lg truncate">{profile.user.name}</p>
                )}
                {profile.user.gamerTag && (
                  <p className="text-cyan-400 truncate">@{profile.user.gamerTag}</p>
                )}
                {profile.user.bio && !editing && (
                  <p className="text-gray-300 mt-2 text-sm sm:text-base line-clamp-2">{profile.user.bio}</p>
                )}
                <p className="text-gray-500 text-xs sm:text-sm mt-2">
                  Member since {new Date(profile.user.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
            <button
              onClick={() => setEditing(!editing)}
              className="bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 px-4 py-2 rounded-lg transition-all whitespace-nowrap self-start sm:self-auto w-full sm:w-auto text-white font-semibold"
            >
              {editing ? "Cancel" : "Edit Profile"}
            </button>
          </div>

          {/* Edit Form */}
          {editing && (
            <form onSubmit={handleUpdateProfile} className="mt-6 pt-6 border-t border-cyan-500/20">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Display Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-midnight-900 border border-cyan-500/20 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-cyan-500"
                    placeholder="Your name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Gamer Tag</label>
                  <input
                    type="text"
                    value={formData.gamerTag}
                    onChange={(e) => setFormData({ ...formData, gamerTag: e.target.value })}
                    className="w-full bg-midnight-900 border border-cyan-500/20 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-cyan-500"
                    placeholder="Your gamer tag"
                  />
                </div>
              </div>
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-400 mb-2">Bio</label>
                <textarea
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  className="w-full bg-midnight-900 border border-cyan-500/20 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-cyan-500 h-24 resize-none"
                  placeholder="Tell us about yourself..."
                />
              </div>
              <div className="mt-4 flex gap-4">
                <button
                  type="submit"
                  className="bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 px-6 py-2 rounded-lg transition-all font-semibold text-white"
                >
                  Save Changes
                </button>
                <button
                  type="button"
                  onClick={() => setEditing(false)}
                  className="bg-midnight-700 hover:bg-midnight-600 px-6 py-2 rounded-lg transition-colors border border-cyan-500/20 text-white"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <div className="bg-midnight-800 border border-cyan-500/20 rounded-lg p-6">
            <div className="text-3xl font-bold mb-1 text-cyan-400">{profile.stats.totalEvents}</div>
            <div className="text-gray-400 text-sm">Total Events</div>
          </div>
          <div className="bg-midnight-800 border border-red-500/20 rounded-lg p-6">
            <div className="text-3xl font-bold mb-1 text-red-400">{profile.stats.upcomingEvents}</div>
            <div className="text-gray-400 text-sm">Upcoming</div>
          </div>
          <div className="bg-midnight-800 border border-blue-500/20 rounded-lg p-6">
            <div className="text-3xl font-bold mb-1 text-blue-400">{profile.stats.completedEvents}</div>
            <div className="text-gray-400 text-sm">Completed</div>
          </div>
          <div className="bg-midnight-800 border border-green-500/20 rounded-lg p-6">
            <div className="text-3xl font-bold mb-1 text-green-400">{profile.stats.teamsJoined}</div>
            <div className="text-gray-400 text-sm">Teams</div>
          </div>
          <div className="bg-midnight-800 border border-yellow-500/20 rounded-lg p-6">
            <div className="text-3xl font-bold mb-1 text-yellow-400">{profile.stats.checkedInEvents}</div>
            <div className="text-gray-400 text-sm">Checked In</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Event History */}
          <div className="lg:col-span-2">
            <div className="bg-midnight-800 rounded-lg p-6 border border-cyan-500/20 mb-6">
              <h2 className="text-2xl font-bold mb-4 text-cyan-400">My Registrations</h2>
              
              {profile.upcomingEvents.length === 0 && profile.pastEvents.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-400 mb-4">You haven't registered for any events yet</p>
                  <Link
                    href="/events"
                    className="inline-block bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 px-6 py-2 rounded-lg transition-all font-semibold text-white"
                  >
                    Browse Events
                  </Link>
                </div>
              ) : (
                <div className="space-y-6">
                  {profile.upcomingEvents.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold mb-3 text-cyan-400">Upcoming Events</h3>
                      <div className="space-y-3">
                        {profile.upcomingEvents.map((reg) => (
                          <div
                            key={reg.id}
                            className="bg-midnight-900 rounded-lg p-4 border border-cyan-500/20 hover:border-cyan-500/50 transition-all"
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1">
                                <Link
                                  href={`/events/${reg.event.id}`}
                                  className="font-semibold hover:text-cyan-400 transition-colors text-white"
                                >
                                  {reg.event.name}
                                </Link>
                                <div className="flex flex-wrap gap-2 mt-2 text-sm">
                                  <span className="bg-cyan-600/30 border border-cyan-500/30 px-2 py-1 rounded text-white">
                                    {reg.event.game}
                                  </span>
                                  {reg.event.isOnline ? (
                                    <span className="bg-blue-600/30 border border-blue-500/30 px-2 py-1 rounded text-white">Online</span>
                                  ) : (
                                    <span className="bg-green-600/30 border border-green-500/30 px-2 py-1 rounded text-white">
                                      {reg.event.venue}
                                    </span>
                                  )}
                                </div>
                                <div className="text-sm text-gray-400 mt-2 space-y-1">
                                  <div>📅 {formatDate(reg.event.startDate)}</div>
                                  {reg.seat && (
                                    <div>
                                      💺 Seat {reg.seat.label}
                                      {reg.seat.type === "VIP" && (
                                        <span className="ml-2 text-yellow-400">⭐ VIP</span>
                                      )}
                                    </div>
                                  )}
                                  {reg.team && (
                                    <div>
                                      👥 Team: {reg.team.name}
                                      {reg.team.tag && ` [${reg.team.tag}]`}
                                    </div>
                                  )}
                                </div>
                              </div>
                              
                              <div className="flex flex-col gap-2 min-w-[140px]">
                                <span className={`text-xs px-2 py-1 rounded border text-center ${getStatusBadge(reg.status)}`}>
                                  {reg.status}
                                </span>
                                <span className={`text-xs px-2 py-1 rounded border text-center ${getPaymentBadge(reg.paymentStatus)}`}>
                                  {reg.paymentStatus}
                                </span>
                                {reg.event.entryFee > 0 && (
                                  <div className="text-sm text-center font-bold text-green-400">
                                    ${reg.event.entryFee}
                                  </div>
                                )}
                                {canCancelRegistration(reg) && (
                                  <button
                                    onClick={() => handleCancelRegistration(reg.id, reg.event.name)}
                                    disabled={cancelling === reg.id}
                                    className="mt-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-600/50 px-3 py-1 rounded text-xs font-semibold transition-colors disabled:opacity-50"
                                  >
                                    {cancelling === reg.id ? 'Cancelling...' : 'Cancel'}
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {profile.pastEvents.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold mb-3 text-cyan-400">Past Events</h3>
                      <div className="space-y-2">
                        {profile.pastEvents.slice(0, 5).map((reg) => (
                          <Link
                            key={reg.id}
                            href={`/events/${reg.event.id}`}
                            className="block bg-midnight-900 rounded-lg p-4 hover:bg-midnight-700 transition-colors border border-cyan-500/20 opacity-75"
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="font-semibold text-white">{reg.event.name}</div>
                                <div className="text-sm text-gray-400">{reg.event.game}</div>
                              </div>
                              <div className="text-sm text-gray-400">
                                {new Date(reg.event.startDate).toLocaleDateString()}
                              </div>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Teams */}
          <div>
            <div className="bg-midnight-800 rounded-lg p-6 border border-cyan-500/20">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-cyan-400">Teams</h2>
                <Link
                  href="/teams"
                  className="text-cyan-400 hover:text-cyan-300 text-sm"
                >
                  View All
                </Link>
              </div>
              {profile.teams.length === 0 ? (
                <p className="text-gray-400 text-sm text-center py-4">Not in any teams yet</p>
              ) : (
                <div className="space-y-3">
                  {profile.teams.map((team: any) => (
                    <Link
                      key={team.id}
                      href={`/teams/${team.id}`}
                      className="block bg-midnight-900 rounded-lg p-4 hover:bg-midnight-700 transition-colors border border-cyan-500/20"
                    >
                      <div className="font-semibold text-white">
                        {team.name}
                        {team.tag && <span className="text-gray-400 text-sm ml-2">[{team.tag}]</span>}
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        {team.userRole} • {team._count.members} members
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
