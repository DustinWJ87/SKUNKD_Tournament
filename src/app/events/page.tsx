"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
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
  seatMap?: {
    name: string;
    width: number;
    height: number;
  };
  _count: {
    registrations: number;
    teams: number;
  };
}

export default function EventsPage() {
  const { data: session } = useSession();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const response = await fetch("/api/events");
      if (!response.ok) {
        throw new Error("Failed to fetch events");
      }
      const data = await response.json();
      setEvents(data);
    } catch (error) {
      setError("Failed to load events");
      console.error("Error fetching events:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "REGISTRATION_OPEN":
        return "text-green-400 border-green-400/20 bg-green-400/10";
      case "REGISTRATION_CLOSED":
        return "text-yellow-400 border-yellow-400/20 bg-yellow-400/10";
      case "IN_PROGRESS":
        return "text-blue-400 border-blue-400/20 bg-blue-400/10";
      case "COMPLETED":
        return "text-gray-400 border-gray-400/20 bg-gray-400/10";
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

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="font-display text-3xl uppercase text-white">Events</h1>
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="h-64 animate-pulse rounded-3xl bg-white/5"
            />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="font-display text-3xl uppercase text-white">Events</h1>
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
        <h1 className="font-display text-3xl uppercase text-white">Events</h1>
        {session?.user?.role === "ADMIN" && (
          <Link
            href="/admin/events/create"
            className="rounded-full bg-skunkd-purple px-6 py-3 font-semibold uppercase tracking-wide text-white shadow-neon transition hover:bg-skunkd-magenta hover:shadow-cyan"
          >
            Create Event
          </Link>
        )}
      </div>

      {events.length === 0 ? (
        <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-skunkd-charcoal via-skunkd-midnight to-black p-12 text-center">
          <h2 className="font-display text-2xl text-white">No Events Yet</h2>
          <p className="mt-2 text-white/70">
            Check back soon for upcoming tournaments!
          </p>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          {events.map((event) => (
            <div
              key={event.id}
              className="rounded-3xl border border-white/10 bg-gradient-to-br from-skunkd-charcoal via-skunkd-midnight to-black p-6 shadow-neon transition hover:border-skunkd-cyan/50"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="font-display text-xl text-white">
                      {event.title}
                    </h3>
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
                    <p className="mt-2 text-sm text-white/70">
                      {event.description}
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-white/60">Entry Fee</p>
                  <p className="font-semibold text-white">
                    ${event.entryFee.toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-white/60">Prize Pool</p>
                  <p className="font-semibold text-skunkd-cyan">
                    ${event.prizePool.toFixed(2)}
                  </p>
                </div>
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
              </div>

              <div className="mt-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-white/60">Registration:</span>
                  <span className="text-white">
                    {formatDate(event.registrationStart)} -{" "}
                    {formatDate(event.registrationEnd)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/60">Event Start:</span>
                  <span className="text-white">{formatDate(event.eventStart)}</span>
                </div>
              </div>

              <div className="mt-6 flex gap-3">
                <Link
                  href={`/events/${event.id}`}
                  className="flex-1 rounded-full border border-white/20 px-4 py-2 text-center text-sm font-semibold uppercase tracking-wide text-white/80 transition hover:border-skunkd-cyan hover:text-white"
                >
                  View Details
                </Link>
                {session && event.status === "REGISTRATION_OPEN" && (
                  <Link
                    href={`/events/${event.id}/register`}
                    className="flex-1 rounded-full bg-skunkd-purple px-4 py-2 text-center text-sm font-semibold uppercase tracking-wide text-white transition hover:bg-skunkd-magenta"
                  >
                    Register
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}