'use client'

import { useEffect, useState } from "react";
import Link from "next/link";

interface Event {
  id: string;
  name: string;
  description: string | null;
  game: string;
  startDate: string;
  endDate: string | null;
  registrationStart: string;
  registrationEnd: string;
  maxParticipants: number;
  teamSize: number;
  status: string;
  venue: string | null;
  venueAddress: string | null;
  isOnline: boolean;
  entryFee: number;
  prizePool: number | null;
  _count?: {
    registrations: number;
    seats: number;
  };
}

export default function PastEventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPastEvents();
  }, []);

  const fetchPastEvents = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/events?status=COMPLETED');
      if (response.ok) {
        const data = await response.json();
        setEvents(data.events || []);
      }
    } catch (error) {
      console.error('Failed to fetch past events:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-10">
        <header className="flex flex-col gap-3">
          <div className="flex items-center gap-4">
            <Link 
              href="/events" 
              className="text-cyan-400 hover:text-cyan-300 transition"
            >
              ← Back to Events
            </Link>
          </div>
          <h1 className="font-display text-3xl uppercase text-cyan-400">Past Tournaments</h1>
          <p className="text-sm uppercase tracking-[0.3em] text-white/60">
            Browse completed tournament history
          </p>
        </header>
        <div className="text-center text-cyan-400">Loading past tournaments...</div>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <header className="flex flex-col gap-3">
        <div className="flex items-center gap-4">
          <Link 
            href="/events" 
            className="text-cyan-400 hover:text-cyan-300 transition"
          >
            ← Back to Events
          </Link>
        </div>
        <h1 className="font-display text-3xl uppercase text-cyan-400">Past Tournaments</h1>
        <p className="text-sm uppercase tracking-[0.3em] text-white/60">
          Browse completed tournament history
        </p>
      </header>

      {events.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-white/70 text-lg">No completed tournaments yet.</p>
          <p className="text-white/50 text-sm mt-2">Check back after some events have finished!</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {events.map((event) => {
            const participants = event._count?.registrations || 0;
            
            return (
              <Link
                key={event.id}
                href={`/events/${event.id}`}
                className="group flex flex-col gap-4 rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm transition hover:border-purple-500/60"
              >
                <div className="flex items-center justify-between">
                  <span className="rounded-full border border-purple-500/50 text-purple-400 px-3 py-1 text-xs uppercase tracking-[0.3em]">
                    Completed
                  </span>
                  <span className="text-sm text-white/70">
                    {new Date(event.startDate).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                </div>
                
                <h2 className="font-display text-2xl text-cyan-400">{event.name}</h2>
                
                <div className="flex flex-col gap-1 text-sm text-white/70">
                  <p className="flex items-center gap-2">
                    <span className="text-cyan-400">🎮</span> {event.game}
                  </p>
                  <p className="flex items-center gap-2">
                    <span className="text-purple-400">{event.isOnline ? '🌐' : '📍'}</span>
                    {event.isOnline ? 'Online' : event.venue || 'TBA'}
                  </p>
                  {event.prizePool && (
                    <p className="flex items-center gap-2">
                      <span className="text-yellow-400">🏆</span>
                      ${event.prizePool.toLocaleString()} Prize Pool
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-white/10">
                  <p className="text-sm text-white/70">
                    {participants} participants
                  </p>
                  <span className="text-xs uppercase tracking-[0.3em] text-purple-400 opacity-0 transition group-hover:opacity-100">
                    View Results →
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
