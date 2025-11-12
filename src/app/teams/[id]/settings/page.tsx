"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import Link from "next/link"

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
  creator: {
    id: string
    username: string
  }
}

export default function TeamSettingsPage({ params }: { params: { id: string } }) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [team, setTeam] = useState<Team | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<"general" | "appearance" | "social" | "privacy">("general")

  const [formData, setFormData] = useState({
    name: "",
    tag: "",
    description: "",
    logo: "",
    bannerImage: "",
    primaryColor: "#9333ea",
    secondaryColor: "#6b21a8",
    websiteUrl: "",
    twitterUrl: "",
    discordUrl: "",
    twitchUrl: "",
    youtubeUrl: "",
    isPublic: true,
    allowJoinRequests: true,
    maxMembers: 10,
  })

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
        setFormData({
          name: data.name || "",
          tag: data.tag || "",
          description: data.description || "",
          logo: data.logo || "",
          bannerImage: data.bannerImage || "",
          primaryColor: data.primaryColor || "#9333ea",
          secondaryColor: data.secondaryColor || "#6b21a8",
          websiteUrl: data.websiteUrl || "",
          twitterUrl: data.twitterUrl || "",
          discordUrl: data.discordUrl || "",
          twitchUrl: data.twitchUrl || "",
          youtubeUrl: data.youtubeUrl || "",
          isPublic: data.isPublic ?? true,
          allowJoinRequests: data.allowJoinRequests ?? true,
          maxMembers: data.maxMembers || 10,
        })
      } else {
        router.push("/teams")
      }
    } catch (error) {
      console.error("Error fetching team:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!formData.name.trim()) {
      alert("Team name is required")
      return
    }

    try {
      setSaving(true)
      const response = await fetch(`/api/teams/${params.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        const updatedTeam = await response.json()
        setTeam(updatedTeam)
        alert("Settings saved successfully!")
      } else {
        const data = await response.json()
        alert(data.error || "Failed to save settings")
      }
    } catch (error) {
      console.error("Error saving settings:", error)
      alert("Failed to save settings")
    } finally {
      setSaving(false)
    }
  }

  const canManageTeam = () => {
    if (!team || !session?.user) return false
    const user = session.user as any
    return team.creator.id === user.id
  }

  if (loading || !team) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-900 via-gray-900 to-black text-white flex items-center justify-center">
        <div className="text-xl">Loading settings...</div>
      </div>
    )
  }

  if (!canManageTeam()) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-900 via-gray-900 to-black text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p className="text-gray-400 mb-6">Only team captains can access settings</p>
          <Link href={`/teams/${params.id}`} className="text-purple-400 hover:text-purple-300">
            Back to Team
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-900 via-gray-900 to-black text-white">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <Link href={`/teams/${params.id}`} className="text-purple-400 hover:text-purple-300 mb-4 inline-block">
            ← Back to Team
          </Link>
          <h1 className="text-4xl font-bold mb-2">Team Settings</h1>
          <p className="text-gray-400">{team.name}</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto scrollbar-hide pb-2 -mx-4 px-4 md:mx-0 md:px-0">
          {[
            { id: "general", label: "General", icon: "⚙️" },
            { id: "appearance", label: "Appearance", icon: "🎨" },
            { id: "social", label: "Social Links", icon: "🔗" },
            { id: "privacy", label: "Privacy", icon: "🔒" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-3 md:px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap text-sm md:text-base tap-target ${
                activeTab === tab.id
                  ? "bg-purple-600 text-white"
                  : "bg-gray-800/50 text-gray-400 hover:bg-gray-700"
              }`}
            >
              <span>{tab.icon}</span>
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700">
          {activeTab === "general" && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Team Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:border-purple-500"
                  placeholder="Enter team name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Team Tag</label>
                <input
                  type="text"
                  value={formData.tag}
                  onChange={(e) => setFormData({ ...formData, tag: e.target.value })}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:border-purple-500"
                  placeholder="e.g., SKD"
                  maxLength={10}
                />
                <p className="text-xs text-gray-400 mt-1">Short abbreviation for your team (max 10 characters)</p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:border-purple-500 h-32 resize-none"
                  placeholder="Describe your team..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Logo URL</label>
                <input
                  type="url"
                  value={formData.logo}
                  onChange={(e) => setFormData({ ...formData, logo: e.target.value })}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:border-purple-500"
                  placeholder="https://example.com/logo.png"
                />
              </div>
            </div>
          )}

          {activeTab === "appearance" && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">Banner Image URL</label>
                <input
                  type="url"
                  value={formData.bannerImage}
                  onChange={(e) => setFormData({ ...formData, bannerImage: e.target.value })}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:border-purple-500"
                  placeholder="https://example.com/banner.png"
                />
                {formData.bannerImage && (
                  <div className="mt-2 rounded-lg overflow-hidden">
                    <img src={formData.bannerImage} alt="Banner preview" className="w-full h-32 object-cover" />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Primary Color</label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={formData.primaryColor}
                      onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                      className="w-16 h-10 bg-gray-700 border border-gray-600 rounded cursor-pointer"
                    />
                    <input
                      type="text"
                      value={formData.primaryColor}
                      onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                      className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:border-purple-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Secondary Color</label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={formData.secondaryColor}
                      onChange={(e) => setFormData({ ...formData, secondaryColor: e.target.value })}
                      className="w-16 h-10 bg-gray-700 border border-gray-600 rounded cursor-pointer"
                    />
                    <input
                      type="text"
                      value={formData.secondaryColor}
                      onChange={(e) => setFormData({ ...formData, secondaryColor: e.target.value })}
                      className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:border-purple-500"
                    />
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-lg border border-gray-600" style={{ backgroundColor: formData.primaryColor + "20" }}>
                <h3 className="font-bold mb-2" style={{ color: formData.primaryColor }}>Color Preview</h3>
                <p className="text-sm" style={{ color: formData.secondaryColor }}>
                  This is how your team colors will look
                </p>
              </div>
            </div>
          )}

          {activeTab === "social" && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">Website</label>
                <input
                  type="url"
                  value={formData.websiteUrl}
                  onChange={(e) => setFormData({ ...formData, websiteUrl: e.target.value })}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:border-purple-500"
                  placeholder="https://yourteam.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Twitter</label>
                <input
                  type="url"
                  value={formData.twitterUrl}
                  onChange={(e) => setFormData({ ...formData, twitterUrl: e.target.value })}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:border-purple-500"
                  placeholder="https://twitter.com/yourteam"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Discord</label>
                <input
                  type="url"
                  value={formData.discordUrl}
                  onChange={(e) => setFormData({ ...formData, discordUrl: e.target.value })}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:border-purple-500"
                  placeholder="https://discord.gg/yourteam"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Twitch</label>
                <input
                  type="url"
                  value={formData.twitchUrl}
                  onChange={(e) => setFormData({ ...formData, twitchUrl: e.target.value })}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:border-purple-500"
                  placeholder="https://twitch.tv/yourteam"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">YouTube</label>
                <input
                  type="url"
                  value={formData.youtubeUrl}
                  onChange={(e) => setFormData({ ...formData, youtubeUrl: e.target.value })}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:border-purple-500"
                  placeholder="https://youtube.com/yourteam"
                />
              </div>
            </div>
          )}

          {activeTab === "privacy" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-gray-700/50 rounded-lg">
                <div>
                  <h3 className="font-medium mb-1">Public Team</h3>
                  <p className="text-sm text-gray-400">Make your team visible in public listings</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isPublic}
                    onChange={(e) => setFormData({ ...formData, isPublic: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-700/50 rounded-lg">
                <div>
                  <h3 className="font-medium mb-1">Allow Join Requests</h3>
                  <p className="text-sm text-gray-400">Let players request to join your team</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.allowJoinRequests}
                    onChange={(e) => setFormData({ ...formData, allowJoinRequests: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Maximum Members</label>
                <input
                  type="number"
                  min="2"
                  max="50"
                  value={formData.maxMembers}
                  onChange={(e) => setFormData({ ...formData, maxMembers: parseInt(e.target.value) || 10 })}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:border-purple-500"
                />
                <p className="text-xs text-gray-400 mt-1">Maximum number of players allowed in your team (2-50)</p>
              </div>
            </div>
          )}
        </div>

        {/* Save Button */}
        <div className="mt-6 flex flex-col sm:flex-row justify-end gap-3 sm:gap-4">
          <Link
            href={`/teams/${params.id}`}
            className="px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors text-center tap-target"
          >
            Cancel
          </Link>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg font-semibold transition-colors tap-target"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  )
}
