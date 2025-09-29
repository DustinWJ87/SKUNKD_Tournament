"use client";

import { useState } from "react";

interface Seat {
  id: string;
  row: number;
  column: number;
  label: string;
  type: "REGULAR" | "VIP" | "PREMIUM" | "DISABLED" | "RESERVED";
  status: "AVAILABLE" | "RESERVED" | "OCCUPIED" | "BLOCKED";
}

interface SeatMap {
  id: string;
  name: string;
  description: string;
  width: number;
  height: number;
  seats: Seat[];
}

interface SeatSelectionProps {
  seatMap: SeatMap;
  selectedSeatId?: string;
  onSeatSelect?: (seatId: string | null) => void;
  readonly?: boolean;
  showUnavailable?: boolean;
}

export function SeatSelection({
  seatMap,
  selectedSeatId,
  onSeatSelect,
  readonly = false,
  showUnavailable = true,
}: SeatSelectionProps) {
  const [hoveredSeat, setHoveredSeat] = useState<string | null>(null);

  const getSeatTypeColor = (type: string, status: string, isSelected: boolean, isHovered: boolean) => {
    if (isSelected) {
      return "bg-skunkd-cyan border-skunkd-cyan text-black";
    }
    
    if (isHovered && status === "AVAILABLE") {
      return "bg-skunkd-purple border-skunkd-purple text-white";
    }

    switch (status) {
      case "AVAILABLE":
        switch (type) {
          case "VIP":
            return "bg-yellow-500/80 border-yellow-500 text-white hover:bg-yellow-500";
          case "PREMIUM":
            return "bg-purple-500/80 border-purple-500 text-white hover:bg-purple-500";
          case "REGULAR":
            return "bg-blue-500/80 border-blue-500 text-white hover:bg-blue-500";
          default:
            return "bg-gray-500/80 border-gray-500 text-white";
        }
      case "RESERVED":
        return "bg-orange-500/60 border-orange-500/60 text-white/60 cursor-not-allowed";
      case "OCCUPIED":
        return "bg-red-500/60 border-red-500/60 text-white/60 cursor-not-allowed";
      case "BLOCKED":
        return "bg-gray-800/60 border-gray-800/60 text-white/40 cursor-not-allowed";
      default:
        return "bg-gray-500/60 border-gray-500/60 text-white/60 cursor-not-allowed";
    }
  };

  const getSeatTypeLabel = (type: string) => {
    switch (type) {
      case "VIP":
        return "VIP";
      case "PREMIUM":
        return "Premium";
      case "REGULAR":
        return "Regular";
      case "DISABLED":
        return "Disabled";
      case "RESERVED":
        return "Reserved";
      default:
        return type;
    }
  };

  const handleSeatClick = (seat: Seat) => {
    if (readonly || seat.status !== "AVAILABLE") return;
    
    const newSelectedId = selectedSeatId === seat.id ? null : seat.id;
    onSeatSelect?.(newSelectedId);
  };

  // Create a grid representation
  const createSeatGrid = () => {
    const grid: (Seat | null)[][] = [];
    
    // Initialize empty grid
    for (let row = 0; row < seatMap.height; row++) {
      grid[row] = new Array(seatMap.width).fill(null);
    }
    
    // Place seats in grid
    seatMap.seats.forEach((seat) => {
      if (seat.row > 0 && seat.row <= seatMap.height && 
          seat.column > 0 && seat.column <= seatMap.width) {
        grid[seat.row - 1][seat.column - 1] = seat;
      }
    });
    
    return grid;
  };

  const seatGrid = createSeatGrid();

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="font-display text-xl uppercase text-white">{seatMap.name}</h3>
        {seatMap.description && (
          <p className="mt-1 text-sm text-white/70">{seatMap.description}</p>
        )}
      </div>

      {/* Stage/Screen indicator */}
      <div className="text-center">
        <div className="mx-auto w-3/4 rounded-t-full border-2 border-skunkd-cyan bg-skunkd-cyan/20 py-2">
          <span className="text-sm font-semibold uppercase tracking-wide text-skunkd-cyan">
            Stage / Screen
          </span>
        </div>
      </div>

      {/* Seat grid */}
      <div className="overflow-x-auto">
        <div className="mx-auto w-fit">
          <div className="space-y-2">
            {seatGrid.map((row, rowIndex) => (
              <div key={rowIndex} className="flex justify-center gap-2">
                {/* Row label */}
                <div className="flex w-8 items-center justify-center text-sm font-semibold text-white/60">
                  {String.fromCharCode(65 + rowIndex)}
                </div>
                
                {/* Seats in row */}
                {row.map((seat, colIndex) => {
                  if (!seat) {
                    return (
                      <div
                        key={colIndex}
                        className="h-8 w-8 rounded border border-transparent"
                      />
                    );
                  }

                  const isSelected = selectedSeatId === seat.id;
                  const isHovered = hoveredSeat === seat.id;
                  const isClickable = !readonly && seat.status === "AVAILABLE";
                  const shouldShow = showUnavailable || seat.status === "AVAILABLE";

                  if (!shouldShow) {
                    return (
                      <div
                        key={seat.id}
                        className="h-8 w-8 rounded border border-transparent"
                      />
                    );
                  }

                  return (
                    <button
                      key={seat.id}
                      onClick={() => handleSeatClick(seat)}
                      onMouseEnter={() => setHoveredSeat(seat.id)}
                      onMouseLeave={() => setHoveredSeat(null)}
                      disabled={!isClickable}
                      className={`h-8 w-8 rounded border-2 text-xs font-bold transition-all duration-200 ${getSeatTypeColor(
                        seat.type,
                        seat.status,
                        isSelected,
                        isHovered
                      )} ${isClickable ? "cursor-pointer" : ""}`}
                      title={`${seat.label} - ${getSeatTypeLabel(seat.type)} (${seat.status})`}
                    >
                      {colIndex + 1}
                    </button>
                  );
                })}
                
                {/* Row label (right side) */}
                <div className="flex w-8 items-center justify-center text-sm font-semibold text-white/60">
                  {String.fromCharCode(65 + rowIndex)}
                </div>
              </div>
            ))}
          </div>
          
          {/* Column numbers */}
          <div className="mt-2 flex justify-center gap-2">
            <div className="w-8" /> {/* Spacer for row label */}
            {Array.from({ length: seatMap.width }, (_, i) => (
              <div
                key={i}
                className="flex h-6 w-8 items-center justify-center text-xs font-semibold text-white/60"
              >
                {i + 1}
              </div>
            ))}
            <div className="w-8" /> {/* Spacer for row label */}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="rounded-lg border border-white/10 bg-black/20 p-4">
        <h4 className="mb-3 font-semibold text-white">Legend</h4>
        <div className="grid grid-cols-2 gap-3 text-sm lg:grid-cols-5">
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 rounded border-2 border-blue-500 bg-blue-500/80" />
            <span className="text-white/80">Regular</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 rounded border-2 border-yellow-500 bg-yellow-500/80" />
            <span className="text-white/80">VIP</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 rounded border-2 border-purple-500 bg-purple-500/80" />
            <span className="text-white/80">Premium</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 rounded border-2 border-orange-500 bg-orange-500/60" />
            <span className="text-white/80">Reserved</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 rounded border-2 border-skunkd-cyan bg-skunkd-cyan" />
            <span className="text-white/80">Selected</span>
          </div>
        </div>
      </div>

      {/* Selected seat info */}
      {selectedSeatId && (
        <div className="rounded-lg border border-skunkd-cyan/20 bg-skunkd-cyan/10 p-4">
          {(() => {
            const selectedSeat = seatMap.seats.find(s => s.id === selectedSeatId);
            if (!selectedSeat) return null;
            
            return (
              <div className="text-center">
                <h4 className="font-semibold text-skunkd-cyan">Selected Seat</h4>
                <p className="mt-1 text-white">
                  {selectedSeat.label} - {getSeatTypeLabel(selectedSeat.type)}
                </p>
                <p className="text-sm text-white/70">
                  Row {String.fromCharCode(64 + selectedSeat.row)}, Seat {selectedSeat.column}
                </p>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}