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

interface TeamRegistration {
  id: string
  status: string
  event: {
    id: string
    name: string
    game: string
    startDate: string
    status: string
  }
}

interface Team {
  id: string
  name: string
  tag: string | null
  description: string | null
  logo: string | null
  createdAt: string
  creator: {
    id: string
    username: string
    name: string | null
  }
  members: TeamMember[]
  registrations: TeamRegistration[]
  _count: {
    members: number
    registrations: number
  }
}

export default function TeamDetailPage({ params }: { params: { id: string } }) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [team, setTeam] = useState<Team | null>(null)
  const [loading, setLoading] = useState(true)
  const [showAddMember, setShowAddMember] = useState(false)
  const [newMemberUsername, setNewMemberUsername] = useState("")
  const [newMemberRole, setNewMemberRole] = useState("MEMBER")
  const [adding, setAdding] = useState(false)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin")
    }
  }, [status, router])

  useEffect(() => {
    if (session?.user) {
      fetchTeam()
    }
  }, [session, params.id])

  const fetchTeam = async () => {
    try {
      const response = await fetch(`/api/teams/${params.id}`)
      if (response.ok) {
        const data = await response.json()
        setTeam(data)
      } else {
        router.push("/teams")
      }
    } catch (error) {
      console.error("Error fetching team:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!newMemberUsername.trim()) {
      alert("Please enter a username or email")
      return
    }

    try {
      setAdding(true)
      const response = await fetch(`/api/teams/${params.id}/members`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: newMemberUsername,
          role: newMemberRole,
        }),
      })

      if (response.ok) {
        await fetchTeam()
        setShowAddMember(false)
        setNewMemberUsername("")
        setNewMemberRole("MEMBER")
      } else {
        const data = await response.json()
        alert(data.error || "Failed to add member")
      }
    } catch (error) {
      console.error("Error adding member:", error)
      alert("Failed to add member")
    } finally {
      setAdding(false)
    }
  }

  const handleRemoveMember = async (memberId: string, username: string) => {
    if (!confirm(`Are you sure you want to remove ${username} from the team?`)) {
      return
    }

    try {
      const response = await fetch(`/api/teams/${params.id}/members/${memberId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        await fetchTeam()
      } else {
        const data = await response.json()
        alert(data.error || "Failed to remove member")
      }
    } catch (error) {
      console.error("Error removing member:", error)
      alert("Failed to remove member")
    }
  }

  const handleDeleteTeam = async () => {
    if (!confirm(`Are you sure you want to delete "${team?.name}"? This action cannot be undone.`)) {
      return
    }

    try {
      const response = await fetch(`/api/teams/${params.id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        router.push("/teams")
      } else {
        const data = await response.json()
        alert(data.error || "Failed to delete team")
      }
    } catch (error) {
      console.error("Error deleting team:", error)
      alert("Failed to delete team")
    }
  }

  const getRoleBadge = (role: string) => {
    const styles = {
      CAPTAIN: "bg-yellow-100 text-yellow-800",
      CO_CAPTAIN: "bg-blue-100 text-blue-800",
      MEMBER: "bg-gray-100 text-gray-800",
    }
    return styles[role as keyof typeof styles] || styles.MEMBER
  }

  const getUserRole = () => {
    if (!team || !session?.user) return null
    const user = session.user as any
    const member = team.members.find((m) => m.user.id === user.id)
    return member?.role || null
  }

  const canManageTeam = () => {
    const role = getUserRole()
    return role === "CAPTAIN" || role === "CO_CAPTAIN"
  }

  const isCreator = () => {
    if (!team || !session?.user) return false
    const user = session.user as any
    return team.creator.id === user.id
  }

  if (loading || !team) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-900 via-gray-900 to-black text-white flex items-center justify-center">
        <div className="text-xl">Loading team...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-900 via-gray-900 to-black text-white">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link href="/teams" className="text-purple-400 hover:text-purple-300 mb-4 inline-block">
            ← Back to Teams
          </Link>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2">
                {team.name}
                {team.tag && <span className="text-gray-400 ml-2">[{team.tag}]</span>}
              </h1>
              {team.description && <p className="text-gray-400 mt-2">{team.description}</p>}
              <div className="flex items-center gap-4 mt-4 text-sm text-gray-400">
                <div>Created by {team.creator.username}</div>
                <div>•</div>
                <div>{team._count.members} members</div>
                <div>•</div>
                <div>{team._count.registrations} events</div>
              </div>
            </div>
            {isCreator() && (
              <button
                onClick={handleDeleteTeam}
                className="bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-600/50 px-4 py-2 rounded-lg text-sm transition-colors"
              >
                Delete Team
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Members Section */}
          <div className="lg:col-span-2">
            <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">Team Members</h2>
                {canManageTeam() && (
                  <button
                    onClick={() => setShowAddMember(true)}
                    className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg text-sm transition-colors"
                  >
                    + Add Member
                  </button>
                )}
              </div>

              <div className="space-y-3">
                {team.members.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between bg-gray-700/50 rounded-lg p-4"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center font-bold">
                        {member.user.username[0].toUpperCase()}
                      </div>
                      <div>
                        <div className="font-semibold">{member.user.username}</div>
                        {member.user.gamerTag && (
                          <div className="text-sm text-gray-400">@{member.user.gamerTag}</div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-xs px-3 py-1 rounded-full ${getRoleBadge(member.role)}`}>
                        {member.role.replace("_", " ")}
                      </span>
                      {canManageTeam() && member.user.id !== team.creator.id && (
                        <button
                          onClick={() => handleRemoveMember(member.id, member.user.username)}
                          className="text-red-400 hover:text-red-300 text-sm"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Event Registrations */}
          <div>
            <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700">
              <h2 className="text-xl font-bold mb-4">Team Events</h2>
              {team.registrations.length === 0 ? (
                <p className="text-gray-400 text-sm">No event registrations yet</p>
              ) : (
                <div className="space-y-3">
                  {team.registrations.slice(0, 5).map((registration) => (
                    <Link
                      key={registration.id}
                      href={`/events/${registration.event.id}`}
                      className="block bg-gray-700/50 rounded-lg p-3 hover:bg-gray-700 transition-colors"
                    >
                      <div className="font-semibold text-sm">{registration.event.name}</div>
                      <div className="text-xs text-gray-400 mt-1">{registration.event.game}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        {new Date(registration.event.startDate).toLocaleDateString()}
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Add Member Modal */}
        {showAddMember && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-lg p-8 max-w-md w-full border border-gray-700">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">Add Team Member</h2>
                <button
                  onClick={() => setShowAddMember(false)}
                  className="text-gray-400 hover:text-white"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleAddMember} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Username or Email <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={newMemberUsername}
                    onChange={(e) => setNewMemberUsername(e.target.value)}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:border-purple-500"
                    placeholder="Enter username or email"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Role</label>
                  <select
                    value={newMemberRole}
                    onChange={(e) => setNewMemberRole(e.target.value)}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:border-purple-500"
                  >
                    <option value="MEMBER">Member</option>
                    <option value="CO_CAPTAIN">Co-Captain</option>
                    {getUserRole() === "CAPTAIN" && <option value="CAPTAIN">Captain</option>}
                  </select>
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAddMember(false)}
                    className="flex-1 bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={adding}
                    className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed px-4 py-2 rounded-lg font-semibold transition-colors"
                  >
                    {adding ? "Adding..." : "Add Member"}
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
