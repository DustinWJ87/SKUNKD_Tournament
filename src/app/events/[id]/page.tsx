"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useParams } from "next/navigation";
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
  registrations: Array<{
    id: string;
    status: string;
    user: {
      name: string;
      email: string;
    };
    seat?: {
      label: string;
      row: number;
      column: number;
      type: string;
    };
  }>;
  teams: Array<{
    id: string;
    name: string;
    members: Array<{
      id: string;
      status: string;
    }>;
  }>;
  _count: {
    registrations: number;
    teams: number;
  };
}

export default function EventDetailPage() {
  const { data: session } = useSession();
  const params = useParams();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [registering, setRegistering] = useState(false);

  useEffect(() => {
    if (params.id) {
      fetchEvent();
    }
  }, [params.id]);

  const fetchEvent = async () => {
    try {
      const response = await fetch(`/api/events/${params.id}`);
      if (!response.ok) {
        throw new Error("Failed to fetch event");
      }
      const data = await response.json();
      setEvent(data);
    } catch (error) {
      setError("Failed to load event");
      console.error("Error fetching event:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!session) return;

    setRegistering(true);
    try {
      const response = await fetch("/api/registrations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          eventId: params.id,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to register");
      }

      // Refresh event data
      await fetchEvent();
      alert("Registration successful!");
    } catch (error: any) {
      alert(error.message || "Failed to register");
    } finally {
      setRegistering(false);
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
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const isUserRegistered = () => {
    if (!session || !event) return false;
    return event.registrations.some(
      (reg) => reg.user.email === session.user.email
    );
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-64 animate-pulse rounded bg-white/10" />
        <div className="h-96 animate-pulse rounded-3xl bg-white/5" />
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="space-y-6">
        <Link
          href="/events"
          className="inline-flex items-center text-skunkd-cyan hover:text-white"
        >
          ← Back to Events
        </Link>
        <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-6 text-center">
          <p className="text-red-400">{error || "Event not found"}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link
        href="/events"
        className="inline-flex items-center text-skunkd-cyan hover:text-white"
      >
        ← Back to Events
      </Link>

      <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-skunkd-charcoal via-skunkd-midnight to-black p-8 shadow-neon">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-4">
              <h1 className="font-display text-3xl uppercase text-white">
                {event.title}
              </h1>
              <span
                className={`rounded-full border px-3 py-1 text-sm uppercase tracking-wide ${getStatusColor(
                  event.status
                )}`}
              >
                {event.status.replace("_", " ")}
              </span>
            </div>
            <p className="mt-2 text-lg text-skunkd-cyan">{event.game}</p>
            {event.description && (
              <p className="mt-4 text-white/80">{event.description}</p>
            )}
          </div>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <div className="space-y-6">
            <div>
              <h3 className="font-display text-lg uppercase text-white">
                Event Details
              </h3>
              <div className="mt-4 space-y-3">
                <div className="flex justify-between">
                  <span className="text-white/60">Entry Fee:</span>
                  <span className="font-semibold text-white">
                    ${event.entryFee.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/60">Prize Pool:</span>
                  <span className="font-semibold text-skunkd-cyan">
                    ${event.prizePool.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/60">Team Size:</span>
                  <span className="text-white">
                    {event.teamSize === 1 ? "Solo" : `${event.teamSize} players`}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/60">Max Players:</span>
                  <span className="text-white">
                    {event.maxPlayers || "Unlimited"}
                  </span>
                </div>
                {event.maxTeams && (
                  <div className="flex justify-between">
                    <span className="text-white/60">Max Teams:</span>
                    <span className="text-white">{event.maxTeams}</span>
                  </div>
                )}
              </div>
            </div>

            <div>
              <h3 className="font-display text-lg uppercase text-white">
                Schedule
              </h3>
              <div className="mt-4 space-y-3">
                <div>
                  <p className="text-white/60">Registration Opens:</p>
                  <p className="text-white">{formatDate(event.registrationStart)}</p>
                </div>
                <div>
                  <p className="text-white/60">Registration Closes:</p>
                  <p className="text-white">{formatDate(event.registrationEnd)}</p>
                </div>
                <div>
                  <p className="text-white/60">Event Starts:</p>
                  <p className="text-white">{formatDate(event.eventStart)}</p>
                </div>
                {event.eventEnd && (
                  <div>
                    <p className="text-white/60">Event Ends:</p>
                    <p className="text-white">{formatDate(event.eventEnd)}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <h3 className="font-display text-lg uppercase text-white">
                Registration Status
              </h3>
              <div className="mt-4 space-y-3">
                <div className="flex justify-between">
                  <span className="text-white/60">Registered Players:</span>
                  <span className="text-white">
                    {event._count.registrations}
                    {event.maxPlayers && ` / ${event.maxPlayers}`}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/60">Teams Formed:</span>
                  <span className="text-white">
                    {event._count.teams}
                    {event.maxTeams && ` / ${event.maxTeams}`}
                  </span>
                </div>
              </div>

              {session && (
                <div className="mt-6">
                  {isUserRegistered() ? (
                    <div className="rounded-lg border border-green-500/20 bg-green-500/10 p-4 text-center">
                      <p className="text-green-400">✓ You are registered for this event</p>
                    </div>
                  ) : event.status === "REGISTRATION_OPEN" ? (
                    <button
                      onClick={handleRegister}
                      disabled={registering}
                      className="w-full rounded-full bg-skunkd-purple px-6 py-3 font-semibold uppercase tracking-wide text-white shadow-neon transition hover:bg-skunkd-magenta hover:shadow-cyan disabled:opacity-50"
                    >
                      {registering ? "Registering..." : "Register Now"}
                    </button>
                  ) : (
                    <div className="rounded-lg border border-yellow-500/20 bg-yellow-500/10 p-4 text-center">
                      <p className="text-yellow-400">Registration is closed</p>
                    </div>
                  )}
                </div>
              )}

              {!session && (
                <div className="mt-6">
                  <Link
                    href="/auth/signin"
                    className="block w-full rounded-full border border-white/20 px-6 py-3 text-center font-semibold uppercase tracking-wide text-white/80 transition hover:border-skunkd-cyan hover:text-white"
                  >
                    Sign In to Register
                  </Link>
                </div>
              )}
            </div>

            {event.seatMap && (
              <div>
                <h3 className="font-display text-lg uppercase text-white">
                  Venue
                </h3>
                <div className="mt-4">
                  <p className="text-white">{event.seatMap.name}</p>
                  <p className="text-white/60">
                    {event.seatMap.width} × {event.seatMap.height} layout
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}