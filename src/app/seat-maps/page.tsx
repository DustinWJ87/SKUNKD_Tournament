"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";

interface SeatMap {
  id: string;
  name: string;
  description: string;
  width: number;
  height: number;
  creator: {
    name: string;
    email: string;
  };
  seats: Array<{
    id: string;
    row: number;
    column: number;
    label: string;
    type: string;
    status: string;
  }>;
  _count: {
    seats: number;
    events: number;
  };
}

export default function SeatMapsPage() {
  const { data: session } = useSession();
  const [seatMaps, setSeatMaps] = useState<SeatMap[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchSeatMaps();
  }, []);

  const fetchSeatMaps = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/admin/seat-maps");
      if (!response.ok) {
        throw new Error("Failed to fetch seat maps");
      }
      const data = await response.json();
      setSeatMaps(data);
    } catch (error) {
      setError(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const deleteSeatMap = async (seatMapId: string, seatMapName: string) => {
    if (!confirm(`Are you sure you want to delete "${seatMapName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/seat-maps/${seatMapId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete seat map");
      }

      // Refresh seat maps
      await fetchSeatMaps();
      alert("Seat map deleted successfully");
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to delete seat map");
      console.error("Error deleting seat map:", error);
    }
  };

  const getSeatTypeColor = (type: string) => {
    switch (type) {
      case "VIP":
        return "bg-yellow-500";
      case "PREMIUM":
        return "bg-purple-500";
      case "REGULAR":
        return "bg-blue-500";
      case "DISABLED":
        return "bg-gray-500";
      case "RESERVED":
        return "bg-red-500";
      default:
        return "bg-gray-400";
    }
  };

  const getSeatStatusColor = (status: string) => {
    switch (status) {
      case "AVAILABLE":
        return "opacity-100";
      case "RESERVED":
        return "opacity-60";
      case "OCCUPIED":
        return "opacity-40";
      case "BLOCKED":
        return "opacity-20";
      default:
        return "opacity-50";
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="font-display text-3xl uppercase text-white">Seat Maps</h1>
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
        <h1 className="font-display text-3xl uppercase text-white">Seat Maps</h1>
        <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-6 text-center">
          <p className="text-red-400">{error}</p>
          <button
            onClick={fetchSeatMaps}
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
        <h1 className="font-display text-3xl uppercase text-white">Seat Maps</h1>
        {session?.user?.role === "ADMIN" && (
          <Link
            href="/seat-maps/create"
            className="rounded-full bg-skunkd-purple px-6 py-3 font-semibold uppercase tracking-wide text-white shadow-neon transition hover:bg-skunkd-magenta hover:shadow-cyan"
          >
            Create Seat Map
          </Link>
        )}
      </div>

      {seatMaps.length === 0 ? (
        <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-skunkd-charcoal via-skunkd-midnight to-black p-12 text-center">
          <h2 className="font-display text-2xl text-white">No Seat Maps Yet</h2>
          <p className="mt-2 text-white/70">
            Create seat maps to organize tournament venues.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          {seatMaps.map((seatMap) => (
            <div
              key={seatMap.id}
              className="rounded-3xl border border-white/10 bg-gradient-to-br from-skunkd-charcoal via-skunkd-midnight to-black p-6 shadow-neon transition hover:border-skunkd-cyan/50"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-display text-xl text-white">{seatMap.name}</h3>
                  {seatMap.description && (
                    <p className="mt-2 text-sm text-white/70">{seatMap.description}</p>
                  )}
                </div>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-white/60">Dimensions</p>
                  <p className="font-semibold text-white">
                    {seatMap.width} × {seatMap.height}
                  </p>
                </div>
                <div>
                  <p className="text-white/60">Total Seats</p>
                  <p className="font-semibold text-skunkd-cyan">{seatMap._count.seats}</p>
                </div>
                <div>
                  <p className="text-white/60">Used in Events</p>
                  <p className="font-semibold text-white">{seatMap._count.events}</p>
                </div>
              </div>

              {/* Mini seat map preview */}
              <div className="mt-6">
                <p className="mb-3 text-sm text-white/60">Layout Preview</p>
                <div className="rounded-lg border border-white/10 bg-black/20 p-4">
                  <div
                    className="grid gap-1"
                    style={{
                      gridTemplateColumns: `repeat(${Math.min(seatMap.width, 10)}, minmax(0, 1fr))`,
                    }}
                  >
                    {seatMap.seats
                      .slice(0, Math.min(seatMap.width * Math.min(seatMap.height, 5), 50))
                      .map((seat) => (
                        <div
                          key={seat.id}
                          className={`h-3 w-3 rounded-sm ${getSeatTypeColor(
                            seat.type
                          )} ${getSeatStatusColor(seat.status)}`}
                          title={`${seat.label} (${seat.type})`}
                        />
                      ))}
                  </div>
                  {seatMap.seats.length > 50 && (
                    <p className="mt-2 text-xs text-white/40">
                      Showing first 50 seats...
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-6 flex gap-3">
                <Link
                  href={`/seat-maps/${seatMap.id}`}
                  className="flex-1 rounded-full border border-white/20 px-4 py-2 text-center text-sm font-semibold uppercase tracking-wide text-white/80 transition hover:border-skunkd-cyan hover:text-white"
                >
                  View Details
                </Link>
                {session?.user?.role === "SUPERADMIN" && (
                  <button
                    onClick={() => deleteSeatMap(seatMap.id, seatMap.name)}
                    className="rounded-full border border-red-500/20 bg-red-500/10 px-4 py-2 text-sm font-semibold uppercase tracking-wide text-red-400 transition hover:border-red-500 hover:bg-red-500/20 hover:text-red-300"
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Legend */}
      <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-skunkd-charcoal via-skunkd-midnight to-black p-6">
        <h3 className="font-display text-lg uppercase text-white">Seat Types</h3>
        <div className="mt-4 flex flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 rounded-sm bg-blue-500" />
            <span className="text-sm text-white/80">Regular</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 rounded-sm bg-yellow-500" />
            <span className="text-sm text-white/80">VIP</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 rounded-sm bg-purple-500" />
            <span className="text-sm text-white/80">Premium</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 rounded-sm bg-gray-500" />
            <span className="text-sm text-white/80">Disabled</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 rounded-sm bg-red-500" />
            <span className="text-sm text-white/80">Reserved</span>
          </div>
        </div>
      </div>
    </div>
  );
}