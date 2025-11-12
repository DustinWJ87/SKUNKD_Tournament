"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import Link from "next/link"

interface TeamMember {
  id: string
  role: string
  joinedAt: string
  user: {
    id: string
    username: string
    name: string | null
    email: string
    gamerTag: string | null
  }
}

interface Team {
  id: string
  name: string
  tag: string | null
  description: string | null
  logo: string | null
  primaryColor: string | null
  secondaryColor: string | null
  createdAt: string
  creator: {
    id: string
    username: string
    name: string | null
  }
  members: TeamMember[]
  _count: {
    members: number
    registrations: number
  }
}

export default function TeamsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [teams, setTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [creating, setCreating] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    tag: "",
    description: "",
  })

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin")
    }
  }, [status, router])

  useEffect(() => {
    if (session?.user) {
      fetchTeams()
    }
  }, [session])

  const fetchTeams = async () => {
    try {
      const response = await fetch("/api/teams")
      if (response.ok) {
        const data = await response.json()
        setTeams(data)
      }
    } catch (error) {
      console.error("Error fetching teams:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name.trim()) {
      alert("Team name is required")
      return
    }

    try {
      setCreating(true)
      const response = await fetch("/api/teams", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        const newTeam = await response.json()
        setTeams([newTeam, ...teams])
        setShowCreateModal(false)
        setFormData({ name: "", tag: "", description: "" })
        router.push(`/teams/${newTeam.id}`)
      } else {
        const data = await response.json()
        alert(data.error || "Failed to create team")
      }
    } catch (error) {
      console.error("Error creating team:", error)
      alert("Failed to create team")
    } finally {
      setCreating(false)
    }
  }

  const getRoleBadge = (role: string) => {
    const styles = {
      CAPTAIN: "bg-yellow-100 text-yellow-800 border-yellow-300",
      CO_CAPTAIN: "bg-blue-100 text-blue-800 border-blue-300",
      MEMBER: "bg-gray-100 text-gray-800 border-gray-300",
    }
    return styles[role as keyof typeof styles] || styles.MEMBER
  }

  const getUserRole = (team: Team) => {
    const user = session?.user as any
    const member = team.members.find((m) => m.user.id === user?.id)
    return member?.role || null
  }

  if (status === "loading" || loading) {
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
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-cyan-400 mb-2">My Teams</h1>
            <p className="text-gray-400 text-sm sm:text-base">Create and manage your tournament teams</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 px-6 py-3 rounded-lg font-semibold transition-all shadow-lg hover:shadow-cyan-500/50 whitespace-nowrap text-white"
          >
            + Create Team
          </button>
        </div>

        {/* Teams List */}
        {teams.length === 0 ? (
          <div className="bg-midnight-800 rounded-lg border border-cyan-500/20 p-12 text-center">
            <div className="text-6xl mb-4">👥</div>
            <h3 className="text-2xl font-bold text-cyan-400 mb-2">No Teams Yet</h3>
            <p className="text-gray-400 mb-6">
              Create your first team to start competing in tournaments together!
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 px-6 py-3 rounded-lg font-semibold transition-all shadow-lg hover:shadow-cyan-500/50 text-white"
            >
              Create Your First Team
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {teams.map((team) => {
              const userRole = getUserRole(team)
              const primaryColor = team.primaryColor || "#06b6d4"
              const secondaryColor = team.secondaryColor || "#0891b2"
              
              return (
                <Link
                  key={team.id}
                  href={`/teams/${team.id}`}
                  className="bg-midnight-800 rounded-lg overflow-hidden border border-cyan-500/20 hover:border-cyan-500/50 transition-all group hover:shadow-lg hover:shadow-cyan-500/20"
                >
                  {team.logo && (
                    <div className="h-32 overflow-hidden relative">
                      <img
                        src={team.logo}
                        alt={`${team.name} logo`}
                        className="w-full h-full object-cover"
                      />
                      <div
                        className="absolute inset-0 opacity-30"
                        style={{ background: `linear-gradient(to bottom, transparent, ${secondaryColor})` }}
                      />
                    </div>
                  )}
                  
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-xl font-bold text-cyan-400 group-hover:text-cyan-300 transition-colors truncate">
                          {team.name}
                        </h3>
                        {team.tag && (
                          <span className="text-sm text-gray-400">[{team.tag}]</span>
                        )}
                      </div>
                      {userRole && (
                        <span
                          className={`text-xs px-2 py-1 rounded-full border ${getRoleBadge(
                            userRole
                          )}`}
                        >
                          {userRole.replace("_", " ")}
                        </span>
                      )}
                    </div>

                    {team.description && (
                      <p className="text-sm text-gray-400 mb-4 line-clamp-2">
                        {team.description}
                      </p>
                    )}

                    <div className="flex items-center gap-4 text-sm text-gray-400">
                      <div className="flex items-center gap-1">
                        <span>👥</span>
                        <span>{team._count?.members || team.members?.length || 0} members</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span>🏆</span>
                        <span>{team._count?.registrations || 0} events</span>
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-cyan-500/20">
                      <div className="text-xs text-gray-500">
                        Created by {team.creator.username}
                      </div>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}

        {/* Create Team Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="bg-midnight-800 rounded-lg p-8 max-w-md w-full border border-cyan-500/20">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-cyan-400">Create New Team</h2>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-gray-400 hover:text-white"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleCreateTeam} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Team Name <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-midnight-900 border border-cyan-500/20 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-cyan-500"
                    placeholder="Enter team name"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Team Tag (optional)</label>
                  <input
                    type="text"
                    value={formData.tag}
                    onChange={(e) => setFormData({ ...formData, tag: e.target.value })}
                    className="w-full bg-midnight-900 border border-cyan-500/20 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-cyan-500"
                    placeholder="e.g., SKD"
                    maxLength={10}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Description (optional)</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full bg-midnight-900 border border-cyan-500/20 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-cyan-500 h-24 resize-none"
                    placeholder="Describe your team..."
                  />
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1 bg-midnight-700 hover:bg-midnight-600 text-white px-4 py-2 rounded-lg transition-colors border border-cyan-500/20"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={creating}
                    className="flex-1 bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2 rounded-lg font-semibold transition-all text-white"
                  >
                    {creating ? "Creating..." : "Create Team"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
