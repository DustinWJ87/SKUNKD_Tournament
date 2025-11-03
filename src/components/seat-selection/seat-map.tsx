    "use client";

    import { useState } from "react";
    import classNames from "classnames";

    export interface Seat {
      id: string;
      row: string;
      number: number;
      status: "available" | "reserved" | "selected" | "disabled";
      playerName?: string;
    }

    export interface SeatSection {
      id: string;
      name: string;
      seats: Seat[];
      layout: {
        rows: number;
        seatsPerRow: number;
      };
    }

    interface SeatMapProps {
      sections: SeatSection[];
      onSeatSelect: (seatId: string) => void;
      selectedSeats: string[];
      maxSelections?: number;
    }

    export function SeatMap({ sections, onSeatSelect, selectedSeats, maxSelections = 1 }: SeatMapProps) {
      const [hoveredSeat, setHoveredSeat] = useState<string | null>(null);

      const handleSeatClick = (seat: Seat) => {
        if (seat.status === "available" || seat.status === "selected") {
          onSeatSelect(seat.id);
        }
      };

      const getSeatClassName = (seat: Seat) => {
        const isSelected = selectedSeats.includes(seat.id);
        const isHovered = hoveredSeat === seat.id;

        return classNames(
          "relative w-8 h-8 rounded-lg border-2 transition-all duration-200 cursor-pointer text-xs font-bold flex items-center justify-center",
          {
            // Available seats
            "border-white/30 bg-white/10 text-white/70 hover:border-skunkd-cyan hover:bg-skunkd-cyan/20 hover:text-white hover:shadow-cyan":
              seat.status === "available" && !isSelected,

            // Selected seats
            "border-skunkd-purple bg-skunkd-purple text-white shadow-neon":
              isSelected,

            // Reserved seats
            "border-red-500/50 bg-red-500/20 text-red-300 cursor-not-allowed":
              seat.status === "reserved",

            // Disabled seats
            "border-gray-600 bg-gray-800 text-gray-500 cursor-not-allowed":
              seat.status === "disabled",

            // Hover effects
            "scale-110": isHovered && seat.status === "available",
          }
        );
      };

      return (
        <div className="space-y-8">
          {sections.map((section) => (
            <div key={section.id} className="space-y-4">
              <h3 className="font-display text-xl uppercase text-white">{section.name}</h3>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
                <div
                  className="grid gap-2 justify-center"
                  style={{
                    gridTemplateColumns: `repeat(${section.layout.seatsPerRow}, minmax(0, 1fr))`,
                  }}
                >
                  {section.seats.map((seat) => (
                    <div
                      key={seat.id}
                      className={getSeatClassName(seat)}
                      onClick={() => handleSeatClick(seat)}
                      onMouseEnter={() => setHoveredSeat(seat.id)}
                      onMouseLeave={() => setHoveredSeat(null)}
                      title={
                        seat.status === "reserved"
                          ? `Reserved by ${seat.playerName}`
                          : `${seat.row}${seat.number}`
                      }
                    >
                      {seat.number}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}

          {/* Legend */}
          <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded border-2 border-white/30 bg-white/10"></div>
              <span className="text-white/70">Available</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded border-2 border-skunkd-purple bg-skunkd-purple"></div>
              <span className="text-white/70">Selected</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded border-2 border-red-500/50 bg-red-500/20"></div>
              <span className="text-white/70">Reserved</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded border-2 border-gray-600 bg-gray-800"></div>
              <span className="text-white/70">Unavailable</span>
            </div>
          </div>
        </div>
      );
    }