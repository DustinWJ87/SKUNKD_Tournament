    "use client";

    import { useState } from "react";
    import { SeatMap, type SeatSection } from "@/components/seat-selection/seat-map";
    import Link from "next/link";

    // Mock data - replace with real API calls
    const MOCK_EVENT = {
      id: "1",
      name: "Skunkd Showdown: Apex Legends",
      date: "2025-11-10T18:00:00Z",
      description: "Join us for an epic Apex Legends tournament featuring the best players in the
region.",
      registrationDeadline: "2025-11-08T23:59:59Z",
      maxTeamSize: 3,
      prizePool: "$5,000",
    };

    const MOCK_SECTIONS: SeatSection[] = [
      {
        id: "main-floor",
        name: "Main Floor",
        layout: { rows: 6, seatsPerRow: 8 },
        seats: Array.from({ length: 48 }, (_, i) => {
          const row = String.fromCharCode(65 + Math.floor(i / 8)); // A, B, C, etc.
          const number = (i % 8) + 1;
          const status = Math.random() > 0.7 ? "reserved" : "available";

          return {
            id: `${row}${number}`,
            row,
            number,
            status: status as any,
            playerName: status === "reserved" ? `Player${i}` : undefined,
          };
        }),
      },
      {
        id: "vip-section",
        name: "VIP Section",
        layout: { rows: 2, seatsPerRow: 6 },
        seats: Array.from({ length: 12 }, (_, i) => {
          const row = `VIP${String.fromCharCode(65 + Math.floor(i / 6))}`;
          const number = (i % 6) + 1;

          return {
            id: `${row}${number}`,
            row,
            number,
            status: "available" as any,
          };
        }),
      },
    ];

    export default function EventDetailPage({ params }: { params: { id: string } }) {
      const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
      const [showRegistration, setShowRegistration] = useState(false);

      const handleSeatSelect = (seatId: string) => {
        setSelectedSeats(prev => {
          if (prev.includes(seatId)) {
            return prev.filter(id => id !== seatId);
          } else if (prev.length < MOCK_EVENT.maxTeamSize) {
            return [...prev, seatId];
          }
          return prev;
        });
      };

      const handleRegister = () => {
        if (selectedSeats.length > 0) {
          setShowRegistration(true);
        }
      };

      return (
        <div className="space-y-10">
          {/* Event Header */}
          <div className="flex flex-col gap-6 rounded-3xl border border-white/10 bg-gradient-to-br
from-skunkd-charcoal via-skunkd-midnight to-black p-8 shadow-neon">
            <div className="flex items-start justify-between">
              <div className="space-y-4">
                <Link
                  href="/events"
                  className="inline-flex items-center gap-2 text-sm text-skunkd-cyan
hover:text-white"
                >
                  ← Back to Events
                </Link>
                <h1 className="font-display text-3xl uppercase text-white">{MOCK_EVENT.name}</h1>
                <p className="text-white/80">{MOCK_EVENT.description}</p>
              </div>
              <div className="text-right text-sm text-white/70">
                <div>Prize Pool: <span className="text-skunkd-cyan
font-bold">{MOCK_EVENT.prizePool}</span></div>
                <div>Team Size: {MOCK_EVENT.maxTeamSize} players</div>
                <div>Date: {new Date(MOCK_EVENT.date).toLocaleDateString()}</div>
              </div>
            </div>
          </div>

          {/* Seat Selection */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-2xl uppercase text-white">Select Your Seats</h2>
              <div className="text-sm text-white/70">
                Selected: {selectedSeats.length} / {MOCK_EVENT.maxTeamSize}
              </div>
            </div>

            <SeatMap
              sections={MOCK_SECTIONS}
              onSeatSelect={handleSeatSelect}
              selectedSeats={selectedSeats}
              maxSelections={MOCK_EVENT.maxTeamSize}
            />

            {/* Registration Actions */}
            {selectedSeats.length > 0 && (
              <div className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/5 p-6
backdrop-blur-sm">
                <h3 className="font-display text-lg text-white">Selected Seats</h3>
                <div className="flex flex-wrap gap-2">
                  {selectedSeats.map(seatId => (
                    <span
                      key={seatId}
                      className="rounded-full border border-skunkd-purple bg-skunkd-purple/20 px-3
py-1 text-sm text-white"
                    >
                      {seatId}
                    </span>
                  ))}
                </div>
                <button
                  onClick={handleRegister}
                  className="inline-flex items-center justify-center rounded-full bg-skunkd-purple
px-6 py-3 font-semibold uppercase tracking-wide text-white shadow-neon transition
hover:bg-skunkd-magenta hover:shadow-cyan"
                >
                  Register for Tournament
                </button>
              </div>
            )}
          </div>

          {/* Registration Modal/Form would go here */}
          {showRegistration && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80
backdrop-blur-sm">
              <div className="w-full max-w-md rounded-3xl border border-white/10 bg-skunkd-midnight
p-8">
                <h3 className="font-display text-xl text-white mb-4">Complete Registration</h3>
                <p className="text-white/70 mb-6">Registration form would go here...</p>
                <div className="flex gap-4">
                  <button
                    onClick={() => setShowRegistration(false)}
                    className="flex-1 rounded-full border border-white/20 px-4 py-2 text-white/70
hover:text-white"
                  >
                    Cancel
                  </button>
                  <button className="flex-1 rounded-full bg-skunkd-purple px-4 py-2 text-white
hover:bg-skunkd-magenta">
                    Confirm
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      );
    }