"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Event {
  id: string;
  title: string;
  description: string;
  game: string;
  maxTeams?: number;
  maxPlayers?: number;
  teamSize: number;
  entryFee: number;
  prizePool: number;
  status: string;
  registrationStart: string;
  registrationEnd: string;
  eventStart: string;
  eventEnd?: string;
  creator: {
    name: string;
    email: string;
  };
  _count: {
    registrations: number;
    teams: number;
  };
}

export default function AdminEventsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchEvents = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/admin/events");
      if (!response.ok) {
        throw new Error("Failed to fetch events");
      }
      const data = await response.json();
      setEvents(data);
    } catch (error) {
      setError(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (status === "loading") return;

    if (!session) {
      router.push("/auth/signin");
      return;
    }

    if (session.user.role !== "SUPERADMIN" && session.user.role !== "EVENT_ORGANIZER") {
      router.push("/");
      return;
    }

    fetchEvents();
  }, [session, status, router]);

  const updateEventStatus = async (eventId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/events/${eventId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error("Failed to update event status");
      }

      // Refresh events
      await fetchEvents();
    } catch (error) {
      alert("Failed to update event status");
      console.error("Error updating event:", error);
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (status === "loading" || loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="font-display text-3xl uppercase text-white">Admin Console</h1>
        </div>
        <div className="grid gap-6">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="h-32 animate-pulse rounded-3xl bg-white/5"
            />
          ))}
        </div>
      </div>
    );
  }

  if (!session || (session.user.role !== "SUPERADMIN" && session.user.role !== "EVENT_ORGANIZER")) {
    return null; // Will redirect
  }

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="font-display text-3xl uppercase text-white">Admin Console</h1>
        <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-6 text-center">
          <p className="text-red-400">{error}</p>
          <button
            onClick={fetchEvents}
            className="mt-4 rounded-full bg-skunkd-purple px-6 py-2 text-white hover:bg-skunkd-magenta"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl uppercase text-white">Admin Console</h1>
        <Link
          href="/admin/events/create"
          className="rounded-full bg-skunkd-purple px-6 py-3 font-semibold uppercase tracking-wide text-white shadow-neon transition hover:bg-skunkd-magenta hover:shadow-cyan"
        >
          Create Event
        </Link>
      </div>

      <div className="grid gap-4 lg:grid-cols-4">
        <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-skunkd-charcoal via-skunkd-midnight to-black p-6">
          <h3 className="font-display text-lg uppercase text-white">Total Events</h3>
          <p className="mt-2 text-3xl font-bold text-skunkd-cyan">{events.length}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-skunkd-charcoal via-skunkd-midnight to-black p-6">
          <h3 className="font-display text-lg uppercase text-white">Active Events</h3>
          <p className="mt-2 text-3xl font-bold text-green-400">
            {events.filter(e => e.status === "REGISTRATION_OPEN" || e.status === "IN_PROGRESS").length}
          </p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-skunkd-charcoal via-skunkd-midnight to-black p-6">
          <h3 className="font-display text-lg uppercase text-white">Total Registrations</h3>
          <p className="mt-2 text-3xl font-bold text-skunkd-magenta">
            {events.reduce((sum, event) => sum + event._count.registrations, 0)}
          </p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-skunkd-charcoal via-skunkd-midnight to-black p-6">
          <h3 className="font-display text-lg uppercase text-white">Total Teams</h3>
          <p className="mt-2 text-3xl font-bold text-yellow-400">
            {events.reduce((sum, event) => sum + event._count.teams, 0)}
          </p>
        </div>
      </div>

      {/* Action buttons for each event: Edit (admin) and View (public) */}
      <div className="mt-6 space-y-3">
        <h3 className="font-display text-lg uppercase text-white">Event Actions</h3>
        <div className="grid gap-3">
          {events.map((event) => (
            <div
              key={event.id}
              className="flex items-center justify-between rounded-xl border border-white/10 bg-gradient-to-br from-skunkd-charcoal via-skunkd-midnight to-black p-4"
            >
              <div className="text-sm font-medium text-white">{event.title ?? 'Untitled Event'}</div>
              <div className="flex gap-2">
                <Link
                  href={`/admin/events/${event.id}`}
                  className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded transition-colors"
                >
                  Edit
                </Link>
                <Link
                  href={`/events/${event.id}`}
                  className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-sm rounded transition-colors"
                >
                  View
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="font-display text-xl uppercase text-white">Event Management</h2>
        
        {events.length === 0 ? (
          <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-skunkd-charcoal via-skunkd-midnight to-black p-12 text-center">
            <h3 className="font-display text-2xl text-white">No Events Created</h3>
            <p className="mt-2 text-white/70">Create your first tournament event to get started.</p>
            <Link
              href="/admin/events/create"
              className="mt-6 inline-flex rounded-full bg-skunkd-purple px-6 py-3 font-semibold uppercase tracking-wide text-white shadow-neon transition hover:bg-skunkd-magenta hover:shadow-cyan"
            >
              Create First Event
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {events.map((event) => (
              <div
                key={event.id}
                className="rounded-2xl border border-white/10 bg-gradient-to-br from-skunkd-charcoal via-skunkd-midnight to-black p-6"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="font-display text-xl text-white">{event.title}</h3>
                      <span
                        className={`rounded-full border px-2 py-1 text-xs uppercase tracking-wide ${getStatusColor(
                          event.status
                        )}`}
                      >
                        {event.status.replace("_", " ")}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-skunkd-cyan">{event.game}</p>
                    {event.description && (
                      <p className="mt-2 text-sm text-white/70">{event.description}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Link
                      href={`/admin/events/${event.id}/edit`}
                      className="rounded-lg border border-white/20 px-3 py-2 text-xs uppercase tracking-wide text-white/80 transition hover:border-skunkd-cyan hover:text-white"
                    >
                      Edit
                    </Link>
                    <Link
                      href={`/events/${event.id}`}
                      className="rounded-lg border border-white/20 px-3 py-2 text-xs uppercase tracking-wide text-white/80 transition hover:border-skunkd-cyan hover:text-white"
                    >
                      View
                    </Link>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-4 text-sm lg:grid-cols-4">
                  <div>
                    <p className="text-white/60">Registrations</p>
                    <p className="font-semibold text-white">
                      {event._count.registrations}
                      {event.maxPlayers && ` / ${event.maxPlayers}`}
                    </p>
                  </div>
                  <div>
                    <p className="text-white/60">Teams</p>
                    <p className="font-semibold text-white">
                      {event._count.teams}
                      {event.maxTeams && ` / ${event.maxTeams}`}
                    </p>
                  </div>
                  <div>
                    <p className="text-white/60">Entry Fee</p>
                    <p className="font-semibold text-white">${event.entryFee.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-white/60">Prize Pool</p>
                    <p className="font-semibold text-skunkd-cyan">${event.prizePool.toFixed(2)}</p>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between text-sm">
                  <div>
                    <span className="text-white/60">Event Start: </span>
                    <span className="text-white">{formatDate(event.eventStart)}</span>
                  </div>
                  <div className="flex gap-2">
                    {event.status === "DRAFT" && (
                      <button
                        onClick={() => updateEventStatus(event.id, "PUBLISHED")}
                        className="rounded-lg bg-blue-600 px-3 py-1 text-xs uppercase tracking-wide text-white transition hover:bg-blue-700"
                      >
                        Publish
                      </button>
                    )}
                    {event.status === "PUBLISHED" && (
                      <button
                        onClick={() => updateEventStatus(event.id, "REGISTRATION_OPEN")}
                        className="rounded-lg bg-green-600 px-3 py-1 text-xs uppercase tracking-wide text-white transition hover:bg-green-700"
                      >
                        Open Registration
                      </button>
                    )}
                    {event.status === "REGISTRATION_OPEN" && (
                      <button
                        onClick={() => updateEventStatus(event.id, "REGISTRATION_CLOSED")}
                        className="rounded-lg bg-yellow-600 px-3 py-1 text-xs uppercase tracking-wide text-white transition hover:bg-yellow-700"
                      >
                        Close Registration
                      </button>
                    )}
                    {event.status === "REGISTRATION_CLOSED" && (
                      <button
                        onClick={() => updateEventStatus(event.id, "IN_PROGRESS")}
                        className="rounded-lg bg-purple-600 px-3 py-1 text-xs uppercase tracking-wide text-white transition hover:bg-purple-700"
                      >
                        Start Event
                      </button>
                    )}
                    {event.status === "IN_PROGRESS" && (
                      <button
                        onClick={() => updateEventStatus(event.id, "COMPLETED")}
                        className="rounded-lg bg-cyan-600 px-3 py-1 text-xs uppercase tracking-wide text-white transition hover:bg-cyan-700"
                      >
                        Complete Event
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}