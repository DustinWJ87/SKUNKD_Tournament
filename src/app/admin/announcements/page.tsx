"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"

interface Announcement {
  id: string
  title: string
  content: string
  priority: string
  targetAudience: string
  eventId: string | null
  startDate: string
  endDate: string | null
  isActive: boolean
  createdAt: string
  creator: {
    id: string
    name: string | null
    username: string
  }
}

export default function AnnouncementsPage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    priority: "NORMAL",
    targetAudience: "ALL_USERS",
    eventId: "",
    endDate: "",
    sendNotification: true,
  })

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin")
    } else if (session?.user?.role !== "ADMIN" && session?.user?.role !== "ORGANIZER") {
      router.push("/admin")
    }
  }, [status, session, router])

  useEffect(() => {
    if (status === "authenticated") {
      fetchAnnouncements()
    }
  }, [status])

  async function fetchAnnouncements() {
    try {
      setLoading(true)
      const res = await fetch("/api/admin/announcements?activeOnly=false")
      if (res.ok) {
        const data = await res.json()
        setAnnouncements(data.announcements)
      }
    } catch (error) {
      console.error("Failed to fetch announcements:", error)
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    try {
      const res = await fetch("/api/admin/announcements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (res.ok) {
        setShowCreateModal(false)
        setFormData({
          title: "",
          content: "",
          priority: "NORMAL",
          targetAudience: "ALL_USERS",
          eventId: "",
          endDate: "",
          sendNotification: true,
        })
        fetchAnnouncements()
      } else {
        alert("Failed to create announcement")
      }
    } catch (error) {
      console.error("Failed to create announcement:", error)
      alert("Failed to create announcement")
    }
  }

  if (status === "loading" || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-midnight-900">
        <div className="text-lg text-gray-400">Loading announcements...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-midnight-900 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 sm:gap-6 mb-8">
          <div className="flex-1 min-w-0">
            <h1 className="text-3xl sm:text-4xl font-bold text-cyan-400 mb-2">Announcements</h1>
            <p className="text-gray-400 text-sm sm:text-base">Manage platform announcements and notifications</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-cyan-500/20 text-cyan-400 px-4 py-2 rounded-lg hover:bg-cyan-500/30 transition-colors border border-cyan-500/20 whitespace-nowrap sm:self-start"
          >
            Create Announcement
          </button>
        </div>

        <div className="space-y-4">
          {announcements.map((announcement) => (
            <div
              key={announcement.id}
              className="bg-midnight-800 rounded-lg border border-cyan-500/20 p-6"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-3 mb-2">
                    <h3 className="text-xl font-semibold text-white">{announcement.title}</h3>
                    <span
                      className={`px-2 py-1 text-xs rounded ${
                        announcement.priority === "URGENT"
                          ? "bg-red-500/20 text-red-400"
                          : announcement.priority === "HIGH"
                          ? "bg-orange-500/20 text-orange-400"
                          : "bg-gray-500/20 text-gray-400"
                      }`}
                    >
                      {announcement.priority}
                    </span>
                    {announcement.isActive ? (
                      <span className="px-2 py-1 text-xs rounded bg-green-500/20 text-green-400">
                        Active
                      </span>
                    ) : (
                      <span className="px-2 py-1 text-xs rounded bg-gray-500/20 text-gray-400">
                        Inactive
                      </span>
                    )}
                  </div>
                  <p className="text-gray-400 mb-3">{announcement.content}</p>
                  <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                    <div>
                      <strong className="text-gray-400">Target:</strong> {announcement.targetAudience.replace(/_/g, " ")}
                    </div>
                    <div>
                      <strong className="text-gray-400">Created:</strong> {new Date(announcement.createdAt).toLocaleDateString()}
                    </div>
                    <div>
                      <strong className="text-gray-400">By:</strong> {announcement.creator.name || announcement.creator.username}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Create Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-midnight-800 border border-cyan-500/20 rounded-lg max-w-2xl w-full max-h-[80vh] overflow-auto">
              <form onSubmit={handleSubmit} className="p-6">
                <h2 className="text-2xl font-bold mb-4 text-cyan-400">Create Announcement</h2>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-400">Title</label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="w-full bg-midnight-900 border border-cyan-500/20 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-400">Content</label>
                    <textarea
                      value={formData.content}
                      onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                      className="w-full bg-midnight-900 border border-cyan-500/20 rounded-lg px-3 py-2 text-white h-32 focus:outline-none focus:border-cyan-500"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2 text-gray-400">Priority</label>
                      <select
                        value={formData.priority}
                        onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                        className="w-full bg-midnight-900 border border-cyan-500/20 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                      >
                        <option value="LOW">Low</option>
                        <option value="NORMAL">Normal</option>
                        <option value="HIGH">High</option>
                        <option value="URGENT">Urgent</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2 text-gray-400">Target Audience</label>
                      <select
                        value={formData.targetAudience}
                        onChange={(e) => setFormData({ ...formData, targetAudience: e.target.value })}
                        className="w-full bg-midnight-900 border border-cyan-500/20 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                      >
                        <option value="ALL_USERS">All Users</option>
                        <option value="REGISTERED_USERS">Registered Users</option>
                        <option value="EVENT_PARTICIPANTS">Event Participants</option>
                        <option value="ORGANIZERS">Organizers</option>
                        <option value="ADMINS_ONLY">Admins Only</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-400">End Date (Optional)</label>
                    <input
                      type="datetime-local"
                      value={formData.endDate}
                      onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                      className="w-full bg-midnight-900 border border-cyan-500/20 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="sendNotification"
                      checked={formData.sendNotification}
                      onChange={(e) =>
                        setFormData({ ...formData, sendNotification: e.target.checked })
                      }
                      className="w-4 h-4"
                    />
                    <label htmlFor="sendNotification" className="text-sm text-gray-400">
                      Send in-app notifications to users
                    </label>
                  </div>
                </div>

                <div className="flex gap-2 mt-6">
                  <button
                    type="submit"
                    className="bg-cyan-500/20 text-cyan-400 px-4 py-2 rounded-lg hover:bg-cyan-500/30 transition-colors border border-cyan-500/20"
                  >
                    Create Announcement
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="bg-midnight-700 text-gray-400 px-4 py-2 rounded-lg hover:bg-midnight-600 transition-colors"
                  >
                    Cancel
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
