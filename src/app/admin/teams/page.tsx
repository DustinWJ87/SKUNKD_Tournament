"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Team {
  id: string;
  name: string;
  description?: string;
  event: {
    id: string;
    title: string;
    game: string;
    status: string;
  };
  members: Array<{
    id: string;
    role: string;
    status: string;
    user: {
      id: string;
      name: string;
      email: string;
    };
  }>;
  _count: {
    members: number;
  };
}

interface Event {
  id: string;
  title: string;
  game: string;
  status: string;
  teamSize: number;
  maxTeams?: number;
  _count: {
    teams: number;
  };
}

export default function AdminTeamsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [teams, setTeams] = useState<Team[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEventId, setSelectedEventId] = useState<string>("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    eventId: "",
  });

  useEffect(() => {
    if (status === "loading") return;
    if (!session || (session.user?.role !== "SUPERADMIN" && session.user?.role !== "EVENT_ORGANIZER")) {
      router.push("/auth/signin");
      return;
    }

    fetchEvents();
    fetchTeams();
  }, [session, status, router]);

  const fetchEvents = async () => {
    try {
      const response = await fetch("/api/admin/events");
      if (response.ok) {
        const data = await response.json();
        setEvents(data);
      }
    } catch (error) {
      console.error("Error fetching events:", error);
    }
  };

  const fetchTeams = async () => {
    setLoading(true);
    try {
      const url = selectedEventId 
        ? `/api/admin/teams?eventId=${selectedEventId}`
        : "/api/admin/teams";
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setTeams(data);
      }
    } catch (error) {
      console.error("Error fetching teams:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch("/api/admin/teams", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        await fetchTeams();
        setShowCreateForm(false);
        setFormData({ name: "", description: "", eventId: "" });
        alert("Team created successfully!");
      } else {
        const error = await response.json();
        alert(`Error creating team: ${error.error}`);
      }
    } catch (error) {
      console.error("Error creating team:", error);
      alert("Error creating team");
    }
  };

  const deleteTeam = async (teamId: string, teamName: string) => {
    if (!confirm(`Are you sure you want to delete team "${teamName}"? This will also remove all team members.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/teams/${teamId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        await fetchTeams();
        alert("Team deleted successfully");
      } else {
        const error = await response.json();
        alert(`Error deleting team: ${error.error}`);
      }
    } catch (error) {
      console.error("Error deleting team:", error);
      alert("Error deleting team");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "DRAFT":
        return "text-gray-400 border-gray-400/20 bg-gray-400/10";
      case "PUBLISHED":
        return "text-blue-400 border-blue-400/20 bg-blue-400/10";
      case "REGISTRATION_OPEN":
        return "text-green-400 border-green-400/20 bg-green-400/10";
      case "REGISTRATION_CLOSED":
        return "text-yellow-400 border-yellow-400/20 bg-yellow-400/10";
      case "IN_PROGRESS":
        return "text-purple-400 border-purple-400/20 bg-purple-400/10";
      case "COMPLETED":
        return "text-cyan-400 border-cyan-400/20 bg-cyan-400/10";
      case "CANCELLED":
        return "text-red-400 border-red-400/20 bg-red-400/10";
      default:
        return "text-white/60 border-white/20 bg-white/10";
    }
  };

  const getMemberStatusColor = (status: string) => {
    switch (status) {
      case "ACCEPTED":
        return "text-green-400";
      case "PENDING":
        return "text-yellow-400";
      case "DECLINED":
        return "text-red-400";
      default:
        return "text-white/60";
    }
  };

  useEffect(() => {
    fetchTeams();
  }, [selectedEventId]);

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-skunkd-charcoal via-skunkd-midnight to-black flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  if (!session || (session.user?.role !== "SUPERADMIN" && session.user?.role !== "EVENT_ORGANIZER")) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-skunkd-charcoal via-skunkd-midnight to-black p-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="font-display text-4xl uppercase text-white">Team Management</h1>
            <p className="mt-2 text-white/70">Manage tournament teams and members</p>
          </div>
          <button
            onClick={() => setShowCreateForm(true)}
            className="rounded-full bg-skunkd-purple px-6 py-3 font-semibold uppercase tracking-wide text-white shadow-neon transition hover:bg-skunkd-magenta hover:shadow-cyan"
          >
            Create Team
          </button>
        </div>

        {/* Filters */}
        <div className="mb-6 rounded-2xl border border-white/10 bg-gradient-to-br from-skunkd-charcoal via-skunkd-midnight to-black p-6">
          <div className="flex flex-wrap gap-4">
            <div>
              <label htmlFor="eventFilter" className="block text-sm font-medium text-white/80 mb-2">
                Filter by Event
              </label>
              <select
                id="eventFilter"
                value={selectedEventId}
                onChange={(e) => setSelectedEventId(e.target.value)}
                className="rounded-lg border border-white/20 bg-black/30 px-4 py-2 text-white focus:border-skunkd-cyan focus:outline-none"
              >
                <option value="">All Events</option>
                {events.map((event) => (
                  <option key={event.id} value={event.id}>
                    {event.title} ({event.game})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Teams List */}
        <div className="space-y-4">
          {teams.length === 0 ? (
            <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-skunkd-charcoal via-skunkd-midnight to-black p-12 text-center">
              <h3 className="font-display text-2xl text-white">No Teams Found</h3>
              <p className="mt-2 text-white/70">
                {selectedEventId ? "No teams found for the selected event." : "Create your first team to get started."}
              </p>
            </div>
          ) : (
            teams.map((team) => (
              <div
                key={team.id}
                className="rounded-2xl border border-white/10 bg-gradient-to-br from-skunkd-charcoal via-skunkd-midnight to-black p-6"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="font-display text-xl text-white">{team.name}</h3>
                      <span
                        className={`rounded-full border px-2 py-1 text-xs uppercase tracking-wide ${getStatusColor(
                          team.event.status
                        )}`}
                      >
                        {team.event.status.replace("_", " ")}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-skunkd-cyan">
                      {team.event.title} - {team.event.game}
                    </p>
                    {team.description && (
                      <p className="mt-2 text-sm text-white/70">{team.description}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Link
                      href={`/admin/teams/${team.id}`}
                      className="rounded-lg border border-white/20 px-3 py-2 text-xs uppercase tracking-wide text-white/80 transition hover:border-skunkd-cyan hover:text-white"
                    >
                      Manage
                    </Link>
                    {session?.user?.role === "SUPERADMIN" && (
                      <button
                        onClick={() => deleteTeam(team.id, team.name)}
                        className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs uppercase tracking-wide text-red-400 transition hover:border-red-500 hover:bg-red-500/20 hover:text-red-300"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>

                {/* Team Members */}
                <div className="mt-4">
                  <h4 className="text-sm font-semibold text-white/80 mb-2">
                    Members ({team._count.members})
                  </h4>
                  {team.members.length === 0 ? (
                    <p className="text-sm text-white/50">No members yet</p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                      {team.members.map((member) => (
                        <div
                          key={member.id}
                          className="flex items-center justify-between rounded-lg border border-white/10 bg-black/20 p-3"
                        >
                          <div>
                            <p className="text-sm font-medium text-white">{member.user.name}</p>
                            <p className="text-xs text-white/60">{member.user.email}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs font-medium text-skunkd-cyan uppercase">
                              {member.role}
                            </p>
                            <p className={`text-xs ${getMemberStatusColor(member.status)}`}>
                              {member.status}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Create Team Modal */}
        {showCreateForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-md rounded-2xl border border-white/10 bg-gradient-to-br from-skunkd-charcoal via-skunkd-midnight to-black p-6">
              <h2 className="font-display text-2xl uppercase text-white mb-6">Create Team</h2>
              <form onSubmit={handleCreateTeam} className="space-y-4">
                <div>
                  <label htmlFor="eventId" className="block text-sm font-medium text-white/80 mb-2">
                    Event *
                  </label>
                  <select
                    id="eventId"
                    required
                    value={formData.eventId}
                    onChange={(e) => setFormData({ ...formData, eventId: e.target.value })}
                    className="w-full rounded-lg border border-white/20 bg-black/30 px-4 py-3 text-white focus:border-skunkd-cyan focus:outline-none"
                  >
                    <option value="">Select an event</option>
                    {events.map((event) => (
                      <option key={event.id} value={event.id}>
                        {event.title} ({event.game})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-white/80 mb-2">
                    Team Name *
                  </label>
                  <input
                    type="text"
                    id="name"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full rounded-lg border border-white/20 bg-black/30 px-4 py-3 text-white placeholder-white/50 focus:border-skunkd-cyan focus:outline-none"
                    placeholder="Team Awesome"
                  />
                </div>
                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-white/80 mb-2">
                    Description
                  </label>
                  <textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full rounded-lg border border-white/20 bg-black/30 px-4 py-3 text-white placeholder-white/50 focus:border-skunkd-cyan focus:outline-none"
                    placeholder="Optional team description"
                    rows={3}
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowCreateForm(false)}
                    className="flex-1 rounded-lg border border-white/20 px-4 py-3 text-white/80 transition hover:border-white/40 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 rounded-lg bg-skunkd-purple px-4 py-3 text-white transition hover:bg-skunkd-magenta"
                  >
                    Create Team
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}