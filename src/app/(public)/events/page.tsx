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

    export default function EventsPage() {
      const [events, setEvents] = useState<Event[]>([]);
      const [loading, setLoading] = useState(true);

      useEffect(() => {
        fetchEvents();
      }, []);

      const fetchEvents = async () => {
        try {
          setLoading(true);
          const response = await fetch('/api/events');
          if (response.ok) {
            const data = await response.json();
            setEvents(data.events || []);
          }
        } catch (error) {
          console.error('Failed to fetch events:', error);
        } finally {
          setLoading(false);
        }
      };

      const getStatusBadge = (status: string) => {
        switch (status) {
          case 'REGISTRATION_OPEN':
            return { text: 'Open', color: 'border-green-500/50 text-green-400' };
          case 'REGISTRATION_CLOSED':
            return { text: 'Closed', color: 'border-yellow-500/50 text-yellow-400' };
          case 'IN_PROGRESS':
            return { text: 'Live', color: 'border-blue-500/50 text-blue-400' };
          case 'COMPLETED':
            return { text: 'Completed', color: 'border-purple-500/50 text-purple-400' };
          default:
            return { text: status, color: 'border-white/20 text-white/70' };
        }
      };

      const getSpotsRemaining = (event: Event) => {
        const registered = event._count?.registrations || 0;
        return event.maxParticipants - registered;
      };

      if (loading) {
        return (
          <div className="space-y-10">
            <header className="flex flex-col gap-3">
              <h1 className="font-display text-3xl uppercase text-cyan-400">Upcoming Events</h1>
              <p className="text-sm uppercase tracking-[0.3em] text-white/60">
                Reserve your seat in the arena.
              </p>
            </header>
            <div className="text-center text-cyan-400">Loading events...</div>
          </div>
        );
      }

      return (
        <div className="space-y-6 md:space-y-10">
          <header className="flex flex-col gap-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <h1 className="font-display text-2xl md:text-3xl uppercase text-cyan-400">Upcoming Events</h1>
              <Link 
                href="/events/past" 
                className="text-sm uppercase tracking-[0.2em] md:tracking-[0.3em] text-cyan-400 hover:text-cyan-300 transition tap-target"
              >
                Past Tournaments →
              </Link>
            </div>
            <p className="text-xs md:text-sm uppercase tracking-[0.2em] md:tracking-[0.3em] text-white/60">
              Reserve your seat in the arena.
            </p>
          </header>

          {events.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-white/70 text-base md:text-lg">No events available at this time.</p>
              <p className="text-white/50 text-sm mt-2">Check back soon for upcoming tournaments!</p>
            </div>
          ) : (
            <div className="grid gap-4 md:gap-6 sm:grid-cols-2 lg:grid-cols-2">
              {events.map((event) => {
                const statusBadge = getStatusBadge(event.status);
                const spotsRemaining = getSpotsRemaining(event);
                
                return (
                  <Link
                    key={event.id}
                    href={`/events/${event.id}`}
                    className="group flex flex-col gap-3 md:gap-4 rounded-2xl md:rounded-3xl border border-white/10 bg-white/5 p-4 md:p-6 backdrop-blur-sm transition hover:border-skunkd-cyan/60 active:scale-[0.98]"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className={`rounded-full border ${statusBadge.color} px-2 md:px-3 py-1 text-[10px] md:text-xs uppercase tracking-[0.2em] md:tracking-[0.3em] whitespace-nowrap`}>
                        {statusBadge.text}
                      </span>
                      <span className="text-xs md:text-sm text-white/70">
                        {new Date(event.startDate).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                    
                    <h2 className="font-display text-xl md:text-2xl text-cyan-400 line-clamp-2">{event.name}</h2>
                    
                    <div className="flex flex-col gap-1 text-xs md:text-sm text-white/70">
                      <p className="flex items-center gap-2">
                        <span className="text-cyan-400">🎮</span> 
                        <span className="truncate">{event.game}</span>
                      </p>
                      <p className="flex items-center gap-2">
                        <span className="text-purple-400">{event.isOnline ? '🌐' : '📍'}</span>
                        <span className="truncate">{event.isOnline ? 'Online' : event.venue || 'TBA'}</span>
                      </p>
                      {event.prizePool && (
                        <p className="flex items-center gap-2">
                          <span className="text-yellow-400">🏆</span>
                          ${event.prizePool.toLocaleString()} Prize Pool
                        </p>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-white/10">
                      <p className="text-xs md:text-sm text-white/70">
                        Spots: <span className={spotsRemaining > 0 ? 'text-green-400' : 'text-red-400'}>{spotsRemaining}</span>
                      </p>
                      <span className="text-[10px] md:text-xs uppercase tracking-[0.2em] md:tracking-[0.3em] text-skunkd-cyan opacity-0 transition group-hover:opacity-100">
                        View →
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