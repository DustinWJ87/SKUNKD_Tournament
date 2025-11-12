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
  bannerImage: string | null
  primaryColor: string | null
  secondaryColor: string | null
  websiteUrl: string | null
  twitterUrl: string | null
  discordUrl: string | null
  twitchUrl: string | null
  youtubeUrl: string | null
  isPublic: boolean
  allowJoinRequests: boolean
  maxMembers: number
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
  const [inviteMessage, setInviteMessage] = useState("")
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
          message: inviteMessage,
        }),
      })

      if (response.ok) {
        setShowAddMember(false)
        setNewMemberUsername("")
        setInviteMessage("")
        alert("Team invitation sent successfully!")
      } else {
        const data = await response.json()
        alert(data.error || "Failed to send invite")
      }
    } catch (error) {
      console.error("Error sending invite:", error)
      alert("Failed to send invite")
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
      {/* Banner Image */}
      {team.bannerImage && (
        <div className="relative h-64 overflow-hidden">
          <img
            src={team.bannerImage}
            alt={`${team.name} banner`}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-gray-900"></div>
        </div>
      )}

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8" style={{ marginTop: team.bannerImage ? "-4rem" : "0" }}>
          <Link href="/teams" className="text-purple-400 hover:text-purple-300 mb-4 inline-block">
            ← Back to Teams
          </Link>
          <div className="flex flex-col gap-4">
            <div className="flex items-start gap-3 sm:gap-4">
              {team.logo && (
                <img
                  src={team.logo}
                  alt={`${team.name} logo`}
                  className="w-16 h-16 sm:w-24 sm:h-24 rounded-lg border-4 border-gray-900 object-cover flex-shrink-0"
                  style={{ borderColor: team.primaryColor || "#9333ea" }}
                />
              )}
              <div className="min-w-0 flex-1">
                <h1 className="text-2xl sm:text-4xl font-bold mb-2 break-words" style={{ color: team.primaryColor || "#ffffff" }}>
                  {team.name}
                  {team.tag && <span className="text-gray-400 ml-2">[{team.tag}]</span>}
                </h1>
                {team.description && <p className="text-gray-400 mt-2 text-sm sm:text-base max-w-2xl">{team.description}</p>}
                
                {/* Social Links */}
                {(team.websiteUrl || team.twitterUrl || team.discordUrl || team.twitchUrl || team.youtubeUrl) && (
                  <div className="flex items-center gap-3 mt-4">
                    {team.websiteUrl && (
                      <a
                        href={team.websiteUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-400 hover:text-white transition-colors tap-target"
                        title="Website"
                      >
                        🌐
                      </a>
                    )}
                    {team.twitterUrl && (
                      <a
                        href={team.twitterUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-400 hover:text-white transition-colors tap-target"
                        title="Twitter"
                      >
                        🐦
                      </a>
                    )}
                    {team.discordUrl && (
                      <a
                        href={team.discordUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-400 hover:text-white transition-colors tap-target"
                        title="Discord"
                      >
                        💬
                      </a>
                    )}
                    {team.twitchUrl && (
                      <a
                        href={team.twitchUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-400 hover:text-white transition-colors tap-target"
                        title="Twitch"
                      >
                        📺
                      </a>
                    )}
                    {team.youtubeUrl && (
                      <a
                        href={team.youtubeUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-400 hover:text-white transition-colors tap-target"
                        title="YouTube"
                      >
                        ▶️
                      </a>
                    )}
                  </div>
                )}

                <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-4 text-xs sm:text-sm text-gray-400">
                  <div>Created by {team.creator.username}</div>
                  <div className="hidden sm:block">•</div>
                  <div>{team._count.members} / {team.maxMembers} members</div>
                  <div className="hidden sm:block">•</div>
                  <div>{team._count.registrations} events</div>
                </div>
              </div>
            </div>
            
            {/* Action Buttons - Mobile & Desktop */}
            {(canManageTeam() || isCreator()) && (
              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                {canManageTeam() && (
                  <Link
                    href={`/teams/${params.id}/settings`}
                    className="px-4 py-2 rounded-lg text-sm transition-colors border text-center whitespace-nowrap"
                    style={{
                      backgroundColor: team.secondaryColor + "40" || "#6b21a840",
                      borderColor: team.secondaryColor || "#6b21a8",
                      color: team.secondaryColor || "#a78bfa"
                    }}
                  >
                    ⚙️ Settings
                  </Link>
                )}
                {isCreator() && (
                  <button
                    onClick={handleDeleteTeam}
                    className="bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-600/50 px-4 py-2 rounded-lg text-sm transition-colors whitespace-nowrap"
                  >
                    Delete Team
                  </button>
                )}
              </div>
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
                    className="px-4 py-2 rounded-lg text-sm transition-colors font-semibold"
                    style={{
                      backgroundColor: team.primaryColor || "#9333ea",
                      color: "#ffffff"
                    }}
                  >
                    + Invite Member
                  </button>
                )}
              </div>

              <div className="space-y-3">
                {team.members.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between bg-gray-700/50 rounded-lg p-4 border border-gray-600"
                    style={{ borderColor: member.role === "CAPTAIN" ? team.primaryColor + "40" : "#4b5563" }}
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center font-bold"
                        style={{ backgroundColor: team.primaryColor || "#9333ea" }}
                      >
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

        {/* Invite Member Modal */}
        {showAddMember && (
          <div className="fixed inset-0 bg-black/70 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
            <div className="bg-gray-800 rounded-t-2xl sm:rounded-lg p-6 md:p-8 w-full sm:max-w-md border-t sm:border border-gray-700 max-h-[90vh] sm:max-h-[80vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl md:text-2xl font-bold">Invite Team Member</h2>
                <button
                  onClick={() => setShowAddMember(false)}
                  className="text-gray-400 hover:text-white tap-target p-2 -m-2"
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
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 focus:outline-none focus:border-purple-500 text-base"
                    placeholder="Enter username or email"
                    required
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Invitation Message (optional)</label>
                  <textarea
                    value={inviteMessage}
                    onChange={(e) => setInviteMessage(e.target.value)}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 focus:outline-none focus:border-purple-500 h-24 resize-none text-base"
                    placeholder="Add a personal message to your invitation..."
                  />
                </div>

                <div className="bg-gray-700/50 rounded-lg p-3 text-xs md:text-sm text-gray-400">
                  💡 The user will receive a notification and can accept or decline the invitation.
                </div>

                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddMember(false)}
                    className="flex-1 bg-gray-700 hover:bg-gray-600 px-4 py-3 rounded-lg transition-colors tap-target"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={adding}
                    className="flex-1 px-4 py-3 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed tap-target"
                    style={{
                      backgroundColor: team?.primaryColor || "#9333ea",
                      color: "#ffffff"
                    }}
                  >
                    {adding ? "Sending..." : "Send Invite"}
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
