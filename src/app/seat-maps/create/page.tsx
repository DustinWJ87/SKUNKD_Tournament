"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

interface Seat {
  row: number;
  column: number;
  label: string;
  type: "REGULAR" | "VIP" | "PREMIUM" | "DISABLED" | "RESERVED";
  status: "AVAILABLE" | "OCCUPIED" | "MAINTENANCE";
}

export default function CreateSeatMapPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    width: "10",
    height: "5",
  });
  const [seats, setSeats] = useState<Seat[]>([]);
  const [selectedSeatType, setSelectedSeatType] = useState<Seat["type"]>("REGULAR");

  useEffect(() => {
    if (status === "loading") return;
    if (!session || (session.user?.role !== "SUPERADMIN" && session.user?.role !== "EVENT_ORGANIZER")) {
      router.push("/auth/signin");
      return;
    }
  }, [session, status, router]);

  useEffect(() => {
    // Generate initial seat layout when dimensions change
    const width = parseInt(formData.width);
    const height = parseInt(formData.height);
    
    if (width > 0 && height > 0) {
      const newSeats: Seat[] = [];
      for (let row = 0; row < height; row++) {
        for (let col = 0; col < width; col++) {
          newSeats.push({
            row,
            column: col,
            label: `${String.fromCharCode(65 + row)}${col + 1}`,
            type: "REGULAR",
            status: "AVAILABLE",
          });
        }
      }
      setSeats(newSeats);
    }
  }, [formData.width, formData.height]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/seat-maps", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          width: parseInt(formData.width),
          height: parseInt(formData.height),
          seats: seats,
        }),
      });

      if (response.ok) {
        const seatMap = await response.json();
        router.push(`/seat-maps`);
      } else {
        const error = await response.json();
        alert(`Error creating seat map: ${error.error}`);
      }
    } catch (error) {
      console.error("Error creating seat map:", error);
      alert("Error creating seat map");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSeatClick = (row: number, column: number) => {
    setSeats(seats.map(seat => 
      seat.row === row && seat.column === column
        ? { ...seat, type: selectedSeatType }
        : seat
    ));
  };

  const getSeatColor = (seat: Seat) => {
    switch (seat.type) {
      case "REGULAR": return "bg-blue-500 hover:bg-blue-600";
      case "VIP": return "bg-purple-500 hover:bg-purple-600";
      case "PREMIUM": return "bg-yellow-500 hover:bg-yellow-600";
      case "DISABLED": return "bg-gray-500 hover:bg-gray-600";
      case "RESERVED": return "bg-red-500 hover:bg-red-600";
      default: return "bg-blue-500 hover:bg-blue-600";
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  if (!session || (session.user?.role !== "SUPERADMIN" && session.user?.role !== "EVENT_ORGANIZER")) {
    return null;
  }

  const width = parseInt(formData.width);
  const height = parseInt(formData.height);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Create New Seat Map</h1>
          <p className="text-purple-200">Design a seat layout for your venue</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Form Section */}
          <div className="bg-black/20 backdrop-blur-sm rounded-lg border border-purple-500/20 p-6">
            <h2 className="text-2xl font-bold text-white mb-6">Seat Map Details</h2>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-purple-200 mb-2">
                  Seat Map Name *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-black/30 border border-purple-500/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20"
                  placeholder="e.g., Main Arena, Side Hall"
                />
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-purple-200 mb-2">
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  rows={3}
                  value={formData.description}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-black/30 border border-purple-500/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20"
                  placeholder="Describe this seat map..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="width" className="block text-sm font-medium text-purple-200 mb-2">
                    Width (Columns) *
                  </label>
                  <input
                    type="number"
                    id="width"
                    name="width"
                    required
                    min="1"
                    max="20"
                    value={formData.width}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-black/30 border border-purple-500/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20"
                  />
                </div>

                <div>
                  <label htmlFor="height" className="block text-sm font-medium text-purple-200 mb-2">
                    Height (Rows) *
                  </label>
                  <input
                    type="number"
                    id="height"
                    name="height"
                    required
                    min="1"
                    max="20"
                    value={formData.height}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-black/30 border border-purple-500/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20"
                  />
                </div>
              </div>

              {/* Seat Type Selector */}
              <div>
                <label className="block text-sm font-medium text-purple-200 mb-2">
                  Select Seat Type to Paint
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { type: "REGULAR" as const, label: "Regular", color: "bg-blue-500" },
                    { type: "VIP" as const, label: "VIP", color: "bg-purple-500" },
                    { type: "PREMIUM" as const, label: "Premium", color: "bg-yellow-500" },
                    { type: "DISABLED" as const, label: "Disabled", color: "bg-gray-500" },
                    { type: "RESERVED" as const, label: "Reserved", color: "bg-red-500" },
                  ].map(({ type, label, color }) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setSelectedSeatType(type)}
                      className={`px-3 py-2 rounded-lg text-white text-sm transition-all ${
                        selectedSeatType === type
                          ? `${color} ring-2 ring-white`
                          : `${color} opacity-60 hover:opacity-80`
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-4 pt-6">
                <button
                  type="button"
                  onClick={() => router.back()}
                  className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "Creating..." : "Create Seat Map"}
                </button>
              </div>
            </form>
          </div>

          {/* Preview Section */}
          <div className="bg-black/20 backdrop-blur-sm rounded-lg border border-purple-500/20 p-6">
            <h2 className="text-2xl font-bold text-white mb-6">Seat Map Preview</h2>
            
            <div className="mb-4">
              <p className="text-purple-200 text-sm">
                Click on seats to change their type. Current type: <span className="font-bold">{selectedSeatType}</span>
              </p>
            </div>

            {width > 0 && height > 0 && (
              <div className="bg-black/30 p-4 rounded-lg">
                <div 
                  className="grid gap-2 mx-auto"
                  style={{ 
                    gridTemplateColumns: `repeat(${width}, minmax(0, 1fr))`,
                    maxWidth: `${width * 40}px`
                  }}
                >
                  {seats.map((seat) => (
                    <button
                      key={`${seat.row}-${seat.column}`}
                      type="button"
                      onClick={() => handleSeatClick(seat.row, seat.column)}
                      className={`w-8 h-8 rounded text-xs font-bold text-white transition-all ${getSeatColor(seat)}`}
                      title={`${seat.label} - ${seat.type}`}
                    >
                      {seat.label}
                    </button>
                  ))}
                </div>

                <div className="mt-4 text-center">
                  <div className="text-purple-200 text-sm">
                    Total Seats: {seats.length}
                  </div>
                  <div className="flex justify-center gap-4 mt-2 text-xs">
                    <span className="flex items-center gap-1">
                      <div className="w-3 h-3 bg-blue-500 rounded"></div>
                      Regular: {seats.filter(s => s.type === "REGULAR").length}
                    </span>
                    <span className="flex items-center gap-1">
                      <div className="w-3 h-3 bg-purple-500 rounded"></div>
                      VIP: {seats.filter(s => s.type === "VIP").length}
                    </span>
                    <span className="flex items-center gap-1">
                      <div className="w-3 h-3 bg-yellow-500 rounded"></div>
                      Premium: {seats.filter(s => s.type === "PREMIUM").length}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}