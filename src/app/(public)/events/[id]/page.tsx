"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { SeatMap, SeatSection } from "@/components/seat-selection/seat-map";

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
  bannerImage: string | null;
  thumbnailImage: string | null;
}

export default function EventDetailPage({ params }: { params: { id: string } }) {
  const { data: session, status: sessionStatus } = useSession()
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [seats, setSeats] = useState<any[]>([])
  const [selectedSeatId, setSelectedSeatId] = useState<string | null>(null)
  const [showSeatSelection, setShowSeatSelection] = useState(false)
  const [registering, setRegistering] = useState(false)
  const [registrationSuccess, setRegistrationSuccess] = useState(false)
  const [teams, setTeams] = useState<any[]>([])
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null)

  useEffect(() => {
    fetchEvent();
    if (session?.user) {
      fetchSeats();
      fetchUserTeams();
    }
  }, [params.id, session]);

  const fetchEvent = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/events/${params.id}`);
      if (response.ok) {
        const data = await response.json();
        setEvent(data.event);
      } else {
        setError("Event not found");
      }
    } catch (err) {
      setError("Failed to load event");
      console.error("Error fetching event:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSeats = async () => {
    try {
      const response = await fetch(`/api/events/${params.id}/seats`);
      if (response.ok) {
        const data = await response.json();
        setSeats(data.seats || []);
      }
    } catch (err) {
      console.error("Error fetching seats:", err);
    }
  };

  const fetchUserTeams = async () => {
    try {
      const response = await fetch('/api/teams');
      if (response.ok) {
        const data = await response.json();
        setTeams(data);
      }
    } catch (err) {
      console.error("Error fetching teams:", err);
    }
  };

  const handleRegister = async () => {
    if (!session?.user) {
      window.location.href = '/auth/signin';
      return;
    }

    try {
      setRegistering(true);
      const response = await fetch(`/api/events/${params.id}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          seatId: selectedSeatId,
          teamId: selectedTeamId,
        }),
      });

      if (response.ok) {
        setRegistrationSuccess(true);
        setShowSeatSelection(false);
        fetchSeats(); // Refresh seat availability
      } else {
        const data = await response.json();
        alert(data.error || 'Registration failed');
      }
    } catch (err) {
      console.error('Registration error:', err);
      alert('Failed to register for event');
    } finally {
      setRegistering(false);
    }
  };

  const handleSeatSelect = (seatId: string) => {
    setSelectedSeatId(selectedSeatId === seatId ? null : seatId);
  };

  const getSeatSections = (): SeatSection[] => {
    if (!seats.length) return [];

    // Group seats by row
    const rowMap = new Map<string, any[]>();
    seats.forEach((seat: any) => {
      if (!rowMap.has(seat.row)) {
        rowMap.set(seat.row, []);
      }
      rowMap.get(seat.row)!.push({
        id: seat.id,
        row: seat.row,
        number: seat.number,
        status: seat.status === 'reserved' ? 'reserved' : 
                selectedSeatId === seat.id ? 'selected' : 'available',
        playerName: seat.reservedBy?.gamerTag || seat.reservedBy?.username,
      });
    });

    // Find max seats per row
    let maxSeatsPerRow = 0;
    rowMap.forEach(rowSeats => {
      maxSeatsPerRow = Math.max(maxSeatsPerRow, rowSeats.length);
    });

    return [{
      id: 'main',
      name: 'Arena Seating',
      seats: seats.map((seat: any) => ({
        id: seat.id,
        row: seat.row,
        number: seat.number,
        status: seat.status === 'reserved' ? 'reserved' : 
                selectedSeatId === seat.id ? 'selected' : 'available',
        playerName: seat.reservedBy?.gamerTag || seat.reservedBy?.username,
      })),
      layout: {
        rows: rowMap.size,
        seatsPerRow: maxSeatsPerRow,
      },
    }];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'REGISTRATION_OPEN':
        return 'text-green-400';
      case 'REGISTRATION_CLOSED':
        return 'text-yellow-400';
      case 'IN_PROGRESS':
        return 'text-blue-400';
      case 'COMPLETED':
        return 'text-purple-400';
      default:
        return 'text-gray-400';
    }
  };

  const formatStatus = (status: string) => {
    return status.split('_').map(word => 
      word.charAt(0) + word.slice(1).toLowerCase()
    ).join(' ');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-cyan-400 text-xl">Loading event...</div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl text-red-400 mb-4">{error || "Event not found"}</h1>
          <Link
            href="/events"
            className="text-cyan-400 hover:text-cyan-300 underline"
          >
            ← Back to Events
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {/* Event Header */}
      <div className="flex flex-col gap-6 rounded-3xl border border-white/10 bg-gradient-to-br from-skunkd-charcoal via-skunkd-midnight to-black p-8 shadow-neon">
        <div className="flex items-start justify-between">
          <div className="space-y-4">
            <Link
              href="/events"
              className="inline-flex items-center gap-2 text-sm text-skunkd-cyan hover:text-white"
            >
              ← Back to Events
            </Link>
            <h1 className="font-display text-3xl uppercase text-cyan-400">{event.name}</h1>
            <p className="text-white/80">{event.description || 'No description available'}</p>
            <div className="flex gap-4 items-center">
              <span className={`${getStatusColor(event.status)} font-semibold`}>
                {formatStatus(event.status)}
              </span>
              {event.isOnline ? (
                <span className="text-cyan-400">🌐 Online Tournament</span>
              ) : (
                <span className="text-purple-400">📍 {event.venue}</span>
              )}
            </div>
            <div className="flex gap-3 pt-2">
              <Link
                href={`/events/${event.id}/brackets`}
                className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all"
              >
                🏆 View Brackets
              </Link>
            </div>
          </div>
          <div className="text-right text-sm text-white/70 space-y-2">
            <div>Game: <span className="text-white font-semibold">{event.game}</span></div>
            {event.prizePool && (
              <div>Prize Pool: <span className="text-skunkd-cyan font-bold">${event.prizePool.toLocaleString()}</span></div>
            )}
            <div>Entry Fee: <span className="text-white">${event.entryFee.toFixed(2)}</span></div>
            <div>Team Size: <span className="text-white">{event.teamSize} {event.teamSize === 1 ? 'player' : 'players'}</span></div>
            <div>Max Players: <span className="text-white">{event.maxParticipants}</span></div>
          </div>
        </div>

        {/* Event Dates */}
        <div className="border-t border-white/10 pt-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <div className="text-white/50 mb-1">Registration Opens</div>
            <div className="text-white">{formatDate(event.registrationStart)}</div>
          </div>
          <div>
            <div className="text-white/50 mb-1">Registration Closes</div>
            <div className="text-white">{formatDate(event.registrationEnd)}</div>
          </div>
          <div>
            <div className="text-white/50 mb-1">Event Start</div>
            <div className="text-white">{formatDate(event.startDate)}</div>
          </div>
        </div>

        {!event.isOnline && event.venueAddress && (
          <div className="border-t border-white/10 pt-4">
            <div className="text-white/50 text-sm mb-1">Venue Address</div>
            <div className="text-white">{event.venueAddress}</div>
          </div>
        )}
      </div>

      {/* Registration Status */}
      {registrationSuccess ? (
        <div className="rounded-2xl border border-green-500/30 bg-green-500/10 p-6 text-center">
          <h3 className="text-xl font-semibold text-green-400 mb-2">✅ Registration Successful!</h3>
          <p className="text-white/70 mb-4">
            You've successfully registered for this tournament. Check your profile for details.
          </p>
          <Link
            href="/dashboard"
            className="inline-block bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg font-semibold transition-all"
          >
            View My Registrations
          </Link>
        </div>
      ) : event.status === 'REGISTRATION_OPEN' ? (
        <div className="space-y-6">
          <div className="rounded-2xl border border-green-500/30 bg-green-500/10 p-6">
            <h3 className="text-xl font-semibold text-green-400 mb-2">Registration is Open!</h3>
            <p className="text-white/70 mb-4">
              {session?.user 
                ? "Select your seat and complete your registration below." 
                : "Sign in to register for this tournament and secure your spot."}
            </p>
            {!session?.user ? (
              <Link
                href="/auth/signin"
                className="inline-block bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg font-semibold transition-all"
              >
                Sign In to Register
              </Link>
            ) : !showSeatSelection ? (
              <button
                onClick={() => setShowSeatSelection(true)}
                className="inline-block bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg font-semibold transition-all"
              >
                Choose Your Seat
              </button>
            ) : null}
          </div>

          {/* Seat Selection */}
          {showSeatSelection && session?.user && (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-white">Select Your Seat</h3>
                <button
                  onClick={() => {
                    setShowSeatSelection(false);
                    setSelectedSeatId(null);
                    setSelectedTeamId(null);
                  }}
                  className="text-white/70 hover:text-white"
                >
                  ✕ Close
                </button>
              </div>

              {/* Team Selection */}
              {event && event.teamSize > 1 && teams.length > 0 && (
                <div className="mb-6 p-4 bg-purple-500/10 border border-purple-500/30 rounded-lg">
                  <label className="block text-sm font-medium mb-3 text-white">
                    Register as Team (Optional)
                  </label>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setSelectedTeamId(null)}
                      className={`px-4 py-2 rounded-lg border transition-all ${
                        selectedTeamId === null
                          ? 'bg-purple-600 border-purple-500 text-white'
                          : 'bg-gray-700/50 border-gray-600 text-gray-300 hover:border-purple-500/50'
                      }`}
                    >
                      Solo Registration
                    </button>
                    {teams.map((team) => (
                      <button
                        key={team.id}
                        onClick={() => setSelectedTeamId(team.id)}
                        className={`px-4 py-2 rounded-lg border transition-all ${
                          selectedTeamId === team.id
                            ? 'bg-purple-600 border-purple-500 text-white'
                            : 'bg-gray-700/50 border-gray-600 text-gray-300 hover:border-purple-500/50'
                        }`}
                      >
                        {team.name}
                        {team.tag && <span className="ml-1 text-xs opacity-75">[{team.tag}]</span>}
                      </button>
                    ))}
                  </div>
                  {selectedTeamId && (
                    <p className="mt-2 text-xs text-purple-300">
                      💡 Registering as a team for team-based events
                    </p>
                  )}
                </div>
              )}

              {seats.length > 0 ? (
                <>
                  <SeatMap
                    sections={getSeatSections()}
                    onSeatSelect={handleSeatSelect}
                    selectedSeats={selectedSeatId ? [selectedSeatId] : []}
                    maxSelections={1}
                  />

                  <div className="mt-6 flex items-center justify-between border-t border-white/10 pt-6">
                    <div className="text-white/70">
                      {selectedSeatId ? (
                        <span className="text-green-400 font-semibold">
                          Seat selected: {seats.find((s: any) => s.id === selectedSeatId)?.label}
                          {selectedTeamId && (
                            <span className="ml-2 text-purple-400">
                              • Team: {teams.find(t => t.id === selectedTeamId)?.name}
                            </span>
                          )}
                        </span>
                      ) : (
                        <span>Please select a seat to continue</span>
                      )}
                    </div>
                    <button
                      onClick={handleRegister}
                      disabled={!selectedSeatId || registering}
                      className="bg-skunkd-purple hover:bg-skunkd-magenta disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-8 py-3 rounded-lg font-semibold transition-all shadow-neon"
                    >
                      {registering ? 'Registering...' : 'Complete Registration'}
                    </button>
                  </div>
                </>
              ) : (
                <div className="text-center py-8 text-white/70">
                  <p>No seats available for this event.</p>
                </div>
              )}
            </div>
          )}
        </div>
      ) : event.status === 'REGISTRATION_CLOSED' ? (
        <div className="rounded-2xl border border-yellow-500/30 bg-yellow-500/10 p-6 text-center">
          <h3 className="text-xl font-semibold text-yellow-400 mb-2">Registration Closed</h3>
          <p className="text-white/70">
            Registration for this event has closed.
          </p>
        </div>
      ) : event.status === 'COMPLETED' ? (
        <div className="rounded-2xl border border-purple-500/30 bg-purple-500/10 p-6 text-center">
          <h3 className="text-xl font-semibold text-purple-400 mb-2">Event Completed</h3>
          <p className="text-white/70">
            This tournament has concluded. Check back for results and highlights!
          </p>
        </div>
      ) : event.status === 'IN_PROGRESS' ? (
        <div className="rounded-2xl border border-blue-500/30 bg-blue-500/10 p-6 text-center">
          <h3 className="text-xl font-semibold text-blue-400 mb-2">Tournament In Progress</h3>
          <p className="text-white/70">
            This tournament is currently underway. Stay tuned for live updates!
          </p>
        </div>
      ) : (
        <div className="rounded-2xl border border-gray-500/30 bg-gray-500/10 p-6 text-center">
          <h3 className="text-xl font-semibold text-gray-400 mb-2">Registration Not Available</h3>
          <p className="text-white/70">
            Registration is not currently open for this event.
          </p>
        </div>
      )}
    </div>
  );
}