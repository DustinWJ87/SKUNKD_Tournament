"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { SeatSelection } from "@/components/seat-selection/seat-selection";

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
  seatMap?: {
    id: string;
    name: string;
    description: string;
    width: number;
    height: number;
    seats: Array<{
      id: string;
      row: number;
      column: number;
      label: string;
      type: string;
      status: string;
    }>;
  };
}

export default function EventRegisterPage() {
  const { data: session, status } = useSession();
  const params = useParams();
  const router = useRouter();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedSeatId, setSelectedSeatId] = useState<string | null>(null);
  const [registering, setRegistering] = useState(false);

  useEffect(() => {
    if (status === "loading") return;
    
    if (!session) {
      router.push("/auth/signin");
      return;
    }

    if (params.id) {
      fetchEvent();
    }
  }, [params.id, session, status, router]);

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
    if (!session || !event) return;

    setRegistering(true);
    try {
      const response = await fetch("/api/registrations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          eventId: params.id,
          seatId: selectedSeatId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to register");
      }

      // Registration successful
      router.push(`/events/${params.id}?registered=true`);
    } catch (error: any) {
      alert(error.message || "Failed to register");
    } finally {
      setRegistering(false);
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

  if (status === "loading" || loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-64 animate-pulse rounded bg-white/10" />
        <div className="h-96 animate-pulse rounded-3xl bg-white/5" />
      </div>
    );
  }

  if (!session) {
    return null; // Will redirect
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

  if (event.status !== "REGISTRATION_OPEN") {
    return (
      <div className="space-y-6">
        <Link
          href={`/events/${event.id}`}
          className="inline-flex items-center text-skunkd-cyan hover:text-white"
        >
          ← Back to Event
        </Link>
        <div className="rounded-lg border border-yellow-500/20 bg-yellow-500/10 p-6 text-center">
          <h2 className="text-xl font-semibold text-yellow-400">Registration Closed</h2>
          <p className="mt-2 text-yellow-400/80">
            Registration for this event is no longer available.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link
        href={`/events/${event.id}`}
        className="inline-flex items-center text-skunkd-cyan hover:text-white"
      >
        ← Back to Event
      </Link>

      <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-skunkd-charcoal via-skunkd-midnight to-black p-8 shadow-neon">
        <div className="text-center">
          <h1 className="font-display text-3xl uppercase text-white">Register for Event</h1>
          <h2 className="mt-2 text-xl text-skunkd-cyan">{event.title}</h2>
          <p className="mt-1 text-white/70">{event.game}</p>
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2">
            {event.seatMap ? (
              <div>
                <h3 className="mb-4 font-display text-lg uppercase text-white">
                  Select Your Seat
                </h3>
                <SeatSelection
                  seatMap={event.seatMap as any}
                  selectedSeatId={selectedSeatId || undefined}
                  onSeatSelect={(seatId) => setSelectedSeatId(seatId)}
                  showUnavailable={false}
                />
              </div>
            ) : (
              <div className="rounded-lg border border-white/10 bg-black/20 p-8 text-center">
                <h3 className="font-display text-lg uppercase text-white">
                  No Seat Selection Required
                </h3>
                <p className="mt-2 text-white/70">
                  This event does not require seat selection. You can register directly.
                </p>
                <h3 className="font-display text-lg uppercase text-white">
                  No Seat Selection Required
                </h3>
                <p className="mt-2 text-white/70">
                  This event does not require seat selection. You can register directly.
                </p>
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div className="rounded-lg border border-white/10 bg-black/20 p-6">
              <h3 className="font-display text-lg uppercase text-white">
                Registration Summary
              </h3>
              <div className="mt-4 space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-white/60">Event:</span>
                  <span className="text-white">{event.title}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/60">Game:</span>
                  <span className="text-white">{event.game}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/60">Entry Fee:</span>
                  <span className="font-semibold text-white">
                    ${event.entryFee.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/60">Team Size:</span>
                  <span className="text-white">
                    {event.teamSize === 1 ? "Solo" : `${event.teamSize} players`}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/60">Event Date:</span>
                  <span className="text-white">{formatDate(event.eventStart)}</span>
                </div>
                {selectedSeatId && event.seatMap && (
                  <div className="flex justify-between">
                    <span className="text-white/60">Selected Seat:</span>
                    <span className="text-skunkd-cyan">
                      {event.seatMap.seats.find(s => s.id === selectedSeatId)?.label}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-lg border border-white/10 bg-black/20 p-6">
              <h3 className="font-display text-lg uppercase text-white">
                Registration Details
              </h3>
              <div className="mt-4 space-y-2 text-sm text-white/70">
                <p>• Registration is binding and entry fees are non-refundable</p>
                <p>• You must arrive 30 minutes before the event start time</p>
                <p>• Bring a valid ID for check-in</p>
                {event.seatMap && (
                  <p>• Your selected seat will be reserved for the duration of the event</p>
                )}
              </div>
            </div>

            <button
              onClick={handleRegister}
              disabled={registering || (event.seatMap && !selectedSeatId)}
              className="w-full rounded-full bg-skunkd-purple px-6 py-4 font-semibold uppercase tracking-wide text-white shadow-neon transition hover:bg-skunkd-magenta hover:shadow-cyan disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {registering ? (
                "Registering..."
              ) : event.seatMap && !selectedSeatId ? (
                "Select a Seat to Continue"
              ) : (
                `Register for $${event.entryFee.toFixed(2)}`
              )}
            </button>

            {event.seatMap && !selectedSeatId && (
              <p className="text-center text-sm text-white/60">
                Please select a seat from the map above to continue with registration.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}