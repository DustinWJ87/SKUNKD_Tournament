"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { SeatSelection } from "@/components/seat-selection/seat-selection";

interface SeatMap {
  id: string;
  name: string;
  description: string;
  width: number;
  height: number;
  creator: {
    id: string;
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
    events: number;
  };
}

export default function SeatMapDetailPage() {
  const { data: session } = useSession();
  const params = useParams();
  const [seatMap, setSeatMap] = useState<SeatMap | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchSeatMap();
  }, [params.id]);

  const fetchSeatMap = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/seat-maps/${params.id}`);
      
      if (!response.ok) {
        throw new Error("Failed to fetch seat map");
      }
      
      const data = await response.json();
      setSeatMap(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400 mx-auto"></div>
            <p className="text-gray-300 mt-4">Loading seat map...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !seatMap) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <div className="text-red-400 text-xl mb-4">
              {error || "Seat map not found"}
            </div>
            <Link 
              href="/seat-maps"
              className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              ← Back to Seat Maps
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const canEdit = session?.user?.role === "SUPERADMIN" || 
                  (session?.user?.role === "EVENT_ORGANIZER" && session?.user?.id === seatMap.creator.id);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <Link 
              href="/seat-maps"
              className="inline-flex items-center text-purple-400 hover:text-purple-300 mb-4"
            >
              ← Back to Seat Maps
            </Link>
            <h1 className="text-4xl font-bold text-white mb-2">{seatMap.name}</h1>
            <p className="text-gray-300 text-lg">{seatMap.description}</p>
          </div>
          {canEdit && (
            <Link
              href={`/seat-maps/${seatMap.id}/edit`}
              className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              Edit Seat Map
            </Link>
          )}
        </div>

        {/* Seat Map Info */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
            <h3 className="text-gray-400 text-sm font-medium mb-2">Dimensions</h3>
            <p className="text-2xl font-bold text-white">
              {seatMap.width} × {seatMap.height}
            </p>
          </div>
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
            <h3 className="text-gray-400 text-sm font-medium mb-2">Total Seats</h3>
            <p className="text-2xl font-bold text-white">{seatMap.seats.length}</p>
          </div>
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
            <h3 className="text-gray-400 text-sm font-medium mb-2">Used in Events</h3>
            <p className="text-2xl font-bold text-white">{seatMap._count.events}</p>
          </div>
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
            <h3 className="text-gray-400 text-sm font-medium mb-2">Created By</h3>
            <p className="text-white font-medium">{seatMap.creator.name}</p>
            <p className="text-gray-400 text-sm">{seatMap.creator.email}</p>
          </div>
        </div>

        {/* Seat Map Visualization */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
          <h2 className="text-2xl font-bold text-white mb-6">Seat Layout</h2>
          <SeatSelection
            seatMap={{
              ...seatMap,
              seats: seatMap.seats.map(seat => ({
                ...seat,
                type: (seat.type as string).toUpperCase() as
                  | "REGULAR"
                  | "VIP"
                  | "PREMIUM"
                  | "DISABLED"
                  | "RESERVED",
                status: (seat.status as string).toUpperCase() as
                  | "AVAILABLE"
                  | "RESERVED"
                  | "OCCUPIED"
                  | "BLOCKED",
              })),
            }}
            readonly={true}
            showUnavailable={true}
          />
        </div>

        {/* Seat Types Legend */}
        <div className="mt-8 bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
          <h3 className="text-xl font-bold text-white mb-4">Seat Types</h3>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-500 rounded"></div>
              <span className="text-gray-300">Regular</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-yellow-500 rounded"></div>
              <span className="text-gray-300">VIP</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-purple-500 rounded"></div>
              <span className="text-gray-300">Premium</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-gray-500 rounded"></div>
              <span className="text-gray-300">Disabled</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-500 rounded"></div>
              <span className="text-gray-300">Reserved</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}