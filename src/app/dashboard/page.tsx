"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Registration {
  id: string;
  status: string;
  createdAt: string;
  event: {
    title: string;
    game: string;
    eventStart: string;
    entryFee: number;
  };
  seat?: {
    label: string;
    row: number;
    column: number;
    type: string;
  };
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (status === "loading") return;
    
    if (!session) {
      router.push("/auth/signin");
      return;
    }

    fetchRegistrations();
  }, [session, status, router]);

  const fetchRegistrations = async () => {
    try {
      const response = await fetch("/api/registrations");
      if (!response.ok) {
        throw new Error("Failed to fetch registrations");
      }
      const data = await response.json();
      setRegistrations(data);
    } catch (error) {
      setError("Failed to load registrations");
      console.error("Error fetching registrations:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "CONFIRMED":
        return "text-green-400 border-green-400/20 bg-green-400/10";
      case "PENDING":
        return "text-yellow-400 border-yellow-400/20 bg-yellow-400/10";
      case "CANCELLED":
        return "text-red-400 border-red-400/20 bg-red-400/10";
      case "WAITLISTED":
        return "text-blue-400 border-blue-400/20 bg-blue-400/10";
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
          <h1 className="font-display text-3xl uppercase text-white">Dashboard</h1>
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

  if (!session) {
    return null; // Will redirect
  }

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="font-display text-3xl uppercase text-white">Dashboard</h1>
        <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-6 text-center">
          <p className="text-red-400">{error}</p>
          <button
            onClick={fetchRegistrations}
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
        <h1 className="font-display text-3xl uppercase text-white">Dashboard</h1>
        <Link
          href="/events"
          className="rounded-full bg-skunkd-purple px-6 py-3 font-semibold uppercase tracking-wide text-white shadow-neon transition hover:bg-skunkd-magenta hover:shadow-cyan"
        >
          Browse Events
        </Link>
      </div>

      {/* Welcome section */}
      <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-skunkd-charcoal via-skunkd-midnight to-black p-8 shadow-neon">
        <h2 className="font-display text-2xl uppercase text-white">
          Welcome back, {session.user.name || session.user.email}!
        </h2>
        <p className="mt-2 text-white/70">
          Manage your tournament registrations and view upcoming events.
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-skunkd-charcoal via-skunkd-midnight to-black p-6">
          <h3 className="font-display text-lg uppercase text-white">Total Registrations</h3>
          <p className="mt-2 text-3xl font-bold text-skunkd-cyan">{registrations.length}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-skunkd-charcoal via-skunkd-midnight to-black p-6">
          <h3 className="font-display text-lg uppercase text-white">Active Registrations</h3>
          <p className="mt-2 text-3xl font-bold text-green-400">
            {registrations.filter(r => r.status === "CONFIRMED" || r.status === "PENDING").length}
          </p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-skunkd-charcoal via-skunkd-midnight to-black p-6">
          <h3 className="font-display text-lg uppercase text-white">Total Spent</h3>
          <p className="mt-2 text-3xl font-bold text-skunkd-magenta">
            ${registrations.reduce((sum, reg) => sum + reg.event.entryFee, 0).toFixed(2)}
          </p>
        </div>
      </div>

      {/* Registrations */}
      <div className="space-y-4">
        <h2 className="font-display text-xl uppercase text-white">Your Registrations</h2>
        
        {registrations.length === 0 ? (
          <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-skunkd-charcoal via-skunkd-midnight to-black p-12 text-center">
            <h3 className="font-display text-2xl text-white">No Registrations Yet</h3>
            <p className="mt-2 text-white/70">
              Register for your first tournament to get started!
            </p>
            <Link
              href="/events"
              className="mt-6 inline-flex rounded-full bg-skunkd-purple px-6 py-3 font-semibold uppercase tracking-wide text-white shadow-neon transition hover:bg-skunkd-magenta hover:shadow-cyan"
            >
              Browse Events
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {registrations.map((registration) => (
              <div
                key={registration.id}
                className="rounded-2xl border border-white/10 bg-gradient-to-br from-skunkd-charcoal via-skunkd-midnight to-black p-6"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="font-display text-xl text-white">
                        {registration.event.title}
                      </h3>
                      <span
                        className={`rounded-full border px-2 py-1 text-xs uppercase tracking-wide ${getStatusColor(
                          registration.status
                        )}`}
                      >
                        {registration.status}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-skunkd-cyan">{registration.event.game}</p>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-4 text-sm lg:grid-cols-4">
                  <div>
                    <p className="text-white/60">Event Date</p>
                    <p className="font-semibold text-white">
                      {formatDate(registration.event.eventStart)}
                    </p>
                  </div>
                  <div>
                    <p className="text-white/60">Entry Fee</p>
                    <p className="font-semibold text-white">
                      ${registration.event.entryFee.toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-white/60">Registered</p>
                    <p className="font-semibold text-white">
                      {formatDate(registration.createdAt)}
                    </p>
                  </div>
                  {registration.seat && (
                    <div>
                      <p className="text-white/60">Seat</p>
                      <p className="font-semibold text-skunkd-cyan">
                        {registration.seat.label} ({registration.seat.type})
                      </p>
                    </div>
                  )}
                </div>

                <div className="mt-6 flex gap-3">
                  <Link
                    href={`/events/${registration.id}`}
                    className="rounded-full border border-white/20 px-4 py-2 text-sm font-semibold uppercase tracking-wide text-white/80 transition hover:border-skunkd-cyan hover:text-white"
                  >
                    View Event
                  </Link>
                  {registration.status === "CONFIRMED" && (
                    <div className="rounded-full bg-green-500/20 px-4 py-2 text-sm font-semibold uppercase tracking-wide text-green-400">
                      ✓ Confirmed
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}