"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useParams } from "next/navigation";
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
    teamSize: number;
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

interface User {
  id: string;
  name: string;
  email: string;
}

export default function TeamDetailPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const [team, setTeam] = useState<Team | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddMember, setShowAddMember] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [memberRole, setMemberRole] = useState("MEMBER");

  useEffect(() => {
    if (status === "loading") return;
    if (!session || (session.user?.role !== "SUPERADMIN" && session.user?.role !== "EVENT_ORGANIZER")) {
      router.push("/auth/signin");
      return;
    }

    fetchTeam();
    fetchUsers();
  }, [session, status, router, params.id]);

  const fetchTeam = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/teams/${params.id}`);
      if (response.ok) {
        const data = await response.json();
        setTeam(data);
      } else if (response.status === 404) {
        alert("Team not found");
        router.push("/admin/teams");
      }
    } catch (error) {
      console.error("Error fetching team:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      // This would need a users API endpoint - for now we'll skip this
      // const response = await fetch("/api/admin/users");
      // if (response.ok) {
      //   const data = await response.json();
      //   setUsers(data);
      // }
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  const addTeamMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId) return;

    try {
      const response = await fetch(`/api/admin/teams/${params.id}/members`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: selectedUserId,
          role: memberRole,
        }),
      });

      if (response.ok) {
        await fetchTeam();
        setShowAddMember(false);
        setSelectedUserId("");
        setMemberRole("MEMBER");
        alert("Team member added successfully!");
      } else {
        const error = await response.json();
        alert(`Error adding team member: ${error.error}`);
      }
    } catch (error) {
      console.error("Error adding team member:", error);
      alert("Error adding team member");
    }
  };

  const removeMember = async (memberId: string, memberName: string) => {
    if (!confirm(`Are you sure you want to remove ${memberName} from the team?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/teams/${params.id}/members/${memberId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        await fetchTeam();
        alert("Team member removed successfully");
      } else {
        const error = await response.json();
        alert(`Error removing team member: ${error.error}`);
      }
    } catch (error) {
      console.error("Error removing team member:", error);
      alert("Error removing team member");
    }
  };

  const updateMemberStatus = async (memberId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/admin/teams/${params.id}/members/${memberId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: newStatus,
        }),
      });

      if (response.ok) {
        await fetchTeam();
        alert("Member status updated successfully");
      } else {
        const error = await response.json();
        alert(`Error updating member status: ${error.error}`);
      }
    } catch (error) {
      console.error("Error updating member status:", error);
      alert("Error updating member status");
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

  if (!team) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-skunkd-charcoal via-skunkd-midnight to-black flex items-center justify-center">
        <div className="text-white">Team not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-skunkd-charcoal via-skunkd-midnight to-black p-6">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-4 mb-2">
              <Link
                href="/admin/teams"
                className="text-white/60 hover:text-white transition"
              >
                ← Back to Teams
              </Link>
            </div>
            <h1 className="font-display text-4xl uppercase text-white">{team.name}</h1>
            <p className="mt-2 text-white/70">
              {team.event.title} - {team.event.game}
            </p>
          </div>
          <div className="flex gap-3">
            <span
              className={`rounded-full border px-3 py-1 text-sm uppercase tracking-wide ${getStatusColor(
                team.event.status
              )}`}
            >
              {team.event.status.replace("_", " ")}
            </span>
          </div>
        </div>

        {/* Team Info */}
        <div className="mb-8 rounded-2xl border border-white/10 bg-gradient-to-br from-skunkd-charcoal via-skunkd-midnight to-black p-6">
          <h2 className="font-display text-2xl uppercase text-white mb-4">Team Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold text-white/80 mb-2">Details</h3>
              <div className="space-y-2 text-white">
                <p><span className="text-skunkd-cyan">Team Size:</span> {team._count.members} / {team.event.teamSize}</p>
                <p><span className="text-skunkd-cyan">Event:</span> {team.event.title}</p>
                <p><span className="text-skunkd-cyan">Game:</span> {team.event.game}</p>
              </div>
            </div>
            {team.description && (
              <div>
                <h3 className="text-lg font-semibold text-white/80 mb-2">Description</h3>
                <p className="text-white">{team.description}</p>
              </div>
            )}
          </div>
        </div>

        {/* Team Members */}
        <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-skunkd-charcoal via-skunkd-midnight to-black p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-display text-2xl uppercase text-white">
              Team Members ({team._count.members})
            </h2>
            {team._count.members < team.event.teamSize && (
              <button
                onClick={() => setShowAddMember(true)}
                className="rounded-lg bg-skunkd-purple px-4 py-2 text-white transition hover:bg-skunkd-magenta"
              >
                Add Member
              </button>
            )}
          </div>

          {team.members.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-white/60">No team members yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {team.members.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between rounded-lg border border-white/10 bg-black/20 p-4"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-4">
                      <div>
                        <p className="font-medium text-white">{member.user.name}</p>
                        <p className="text-sm text-white/60">{member.user.email}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="rounded-full bg-skunkd-purple/20 px-2 py-1 text-xs font-medium text-skunkd-cyan uppercase">
                          {member.role}
                        </span>
                        <span className={`text-sm font-medium ${getMemberStatusColor(member.status)}`}>
                          {member.status}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {member.status === "PENDING" && (
                      <>
                        <button
                          onClick={() => updateMemberStatus(member.id, "ACCEPTED")}
                          className="rounded-lg border border-green-500/20 bg-green-500/10 px-3 py-1 text-xs text-green-400 transition hover:border-green-500 hover:bg-green-500/20"
                        >
                          Accept
                        </button>
                        <button
                          onClick={() => updateMemberStatus(member.id, "DECLINED")}
                          className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-1 text-xs text-red-400 transition hover:border-red-500 hover:bg-red-500/20"
                        >
                          Decline
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => removeMember(member.id, member.user.name)}
                      className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-1 text-xs text-red-400 transition hover:border-red-500 hover:bg-red-500/20"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Add Member Modal */}
        {showAddMember && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-md rounded-2xl border border-white/10 bg-gradient-to-br from-skunkd-charcoal via-skunkd-midnight to-black p-6">
              <h2 className="font-display text-2xl uppercase text-white mb-6">Add Team Member</h2>
              <form onSubmit={addTeamMember} className="space-y-4">
                <div>
                  <label htmlFor="userId" className="block text-sm font-medium text-white/80 mb-2">
                    User Email *
                  </label>
                  <input
                    type="email"
                    id="userId"
                    required
                    value={selectedUserId}
                    onChange={(e) => setSelectedUserId(e.target.value)}
                    className="w-full rounded-lg border border-white/20 bg-black/30 px-4 py-3 text-white placeholder-white/50 focus:border-skunkd-cyan focus:outline-none"
                    placeholder="user@example.com"
                  />
                  <p className="mt-1 text-xs text-white/50">
                    Enter the email address of the user to add to the team
                  </p>
                </div>
                <div>
                  <label htmlFor="role" className="block text-sm font-medium text-white/80 mb-2">
                    Role *
                  </label>
                  <select
                    id="role"
                    value={memberRole}
                    onChange={(e) => setMemberRole(e.target.value)}
                    className="w-full rounded-lg border border-white/20 bg-black/30 px-4 py-3 text-white focus:border-skunkd-cyan focus:outline-none"
                  >
                    <option value="MEMBER">Member</option>
                    <option value="CAPTAIN">Captain</option>
                  </select>
                </div>
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAddMember(false)}
                    className="flex-1 rounded-lg border border-white/20 px-4 py-3 text-white/80 transition hover:border-white/40 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 rounded-lg bg-skunkd-purple px-4 py-3 text-white transition hover:bg-skunkd-magenta"
                  >
                    Add Member
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