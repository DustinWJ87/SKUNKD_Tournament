"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"

interface Team {
  id: string
  name: string
  tag: string
  logoUrl: string | null
  description: string | null
  discordUrl: string | null
  twitterUrl: string | null
  twitchUrl: string | null
  createdAt: string
  creator: {
    id: string
    name: string | null
    email: string
  }
  _count: {
    members: number
    registrations: number
  }
}

export default function AdminTeamsPage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [teams, setTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin")
    } else if (session?.user?.role !== "ADMIN" && session?.user?.role !== "ORGANIZER") {
      router.push("/admin")
    }
  }, [status, session, router])

  useEffect(() => {
    if (status === "authenticated") {
      fetchTeams()
    }
  }, [status])

  const fetchTeams = async () => {
    try {
      const response = await fetch("/api/teams")
      if (response.ok) {
        const data = await response.json()
        setTeams(data)
      }
    } catch (error) {
      console.error("Failed to fetch teams:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteTeam = async () => {
    if (!selectedTeam) return

    try {
      const response = await fetch(`/api/teams/${selectedTeam.id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        setTeams(teams.filter((team) => team.id !== selectedTeam.id))
        setShowDeleteModal(false)
        setSelectedTeam(null)
      } else {
        const error = await response.json()
        alert(error.error || "Failed to delete team")
      }
    } catch (error) {
      console.error("Failed to delete team:", error)
      alert("Failed to delete team")
    }
  }

  const filteredTeams = teams.filter(
    (team) =>
      team.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      team.tag.toLowerCase().includes(searchTerm.toLowerCase()) ||
      team.creator.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      team.creator.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-midnight-900">
        <div className="text-lg text-gray-400">Loading teams...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-midnight-900 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 sm:gap-6 mb-8">
          <div className="flex-1 min-w-0">
            <h1 className="text-3xl sm:text-4xl font-bold text-cyan-400 mb-2">Team Management</h1>
            <p className="text-gray-400 text-sm sm:text-base">Manage tournament teams and rosters</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-midnight-800 rounded-lg border border-cyan-500/20 p-6">
            <h3 className="text-sm font-medium text-gray-400 mb-2">Total Teams</h3>
            <p className="text-3xl font-bold text-white">{teams.length}</p>
          </div>
          <div className="bg-midnight-800 rounded-lg border border-cyan-500/20 p-6">
            <h3 className="text-sm font-medium text-gray-400 mb-2">Active Registrations</h3>
            <p className="text-3xl font-bold text-white">
              {teams.reduce((acc, team) => acc + team._count.registrations, 0)}
            </p>
          </div>
          <div className="bg-midnight-800 rounded-lg border border-cyan-500/20 p-6">
            <h3 className="text-sm font-medium text-gray-400 mb-2">Total Members</h3>
            <p className="text-3xl font-bold text-white">
              {teams.reduce((acc, team) => acc + team._count.members, 0)}
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="Search teams by name, tag, creator..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-midnight-800 border border-cyan-500/20 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500"
          />
        </div>

        {/* Teams Table */}
        <div className="bg-midnight-800 rounded-lg border border-cyan-500/20 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-midnight-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Team
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Tag
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Creator
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Members
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Registrations
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cyan-500/20">
                {filteredTeams.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-gray-400">
                      {searchTerm ? "No teams found matching your search" : "No teams yet"}
                    </td>
                  </tr>
                ) : (
                  filteredTeams.map((team) => (
                    <tr key={team.id} className="hover:bg-midnight-700">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {team.logoUrl ? (
                            <img
                              src={team.logoUrl}
                              alt={team.name}
                              className="w-10 h-10 rounded-lg object-cover"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-midnight-700 flex items-center justify-center text-cyan-400 font-bold">
                              {team.tag}
                            </div>
                          )}
                          <div>
                            <div className="font-medium text-white">{team.name}</div>
                            {team.description && (
                              <div className="text-sm text-gray-400 line-clamp-1">{team.description}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-cyan-500/20 text-cyan-400">
                          {team.tag}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-white">{team.creator.name || "Unknown"}</div>
                        <div className="text-sm text-gray-400">{team.creator.email}</div>
                      </td>
                      <td className="px-6 py-4 text-white">{team._count.members}</td>
                      <td className="px-6 py-4 text-white">{team._count.registrations}</td>
                      <td className="px-6 py-4 text-gray-400">
                        {new Date(team.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        <button
                          onClick={() => router.push(`/teams/${team.id}`)}
                          className="inline-flex items-center px-3 py-1.5 bg-cyan-500/20 text-cyan-400 rounded-lg hover:bg-cyan-500/30 transition-colors text-sm"
                        >
                          View
                        </button>
                        {session?.user?.role === "ADMIN" && (
                          <button
                            onClick={() => {
                              setSelectedTeam(team)
                              setShowDeleteModal(true)
                            }}
                            className="inline-flex items-center px-3 py-1.5 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors text-sm"
                          >
                            Delete
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedTeam && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-midnight-800 rounded-lg border border-red-500/20 p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-white mb-4">Delete Team</h3>
            <p className="text-gray-400 mb-6">
              Are you sure you want to delete <span className="text-white font-medium">{selectedTeam.name}</span>?
              This will also remove all team members and cancel their event registrations. This action cannot be
              undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowDeleteModal(false)
                  setSelectedTeam(null)
                }}
                className="px-4 py-2 bg-midnight-700 text-gray-400 rounded-lg hover:bg-midnight-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteTeam}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                Delete Team
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
