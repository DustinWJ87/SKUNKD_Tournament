"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

interface SeatConfig {
  generateSeats: boolean
  totalSeats: number
  seatsPerRow: number
  vipSeats: number
  seatPrefix: string
}

export default function CreateEventPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [maxParticipants, setMaxParticipants] = useState(64)
  const [seatConfig, setSeatConfig] = useState<SeatConfig>({
    generateSeats: true,
    totalSeats: 64,
    seatsPerRow: 10,
    vipSeats: 10,
    seatPrefix: 'A'
  })

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    const data = {
      name: formData.get("name") as string,
      description: formData.get("description") as string,
      game: formData.get("game") as string,
      startDate: new Date(formData.get("startDate") as string),
      endDate: formData.get("endDate")
        ? new Date(formData.get("endDate") as string)
        : null,
      registrationStart: new Date(formData.get("registrationStart") as string),
      registrationEnd: new Date(formData.get("registrationEnd") as string),
      maxParticipants: parseInt(formData.get("maxParticipants") as string),
      teamSize: parseInt(formData.get("teamSize") as string),
      venue: formData.get("venue") as string,
      venueAddress: formData.get("venueAddress") as string,
      isOnline: formData.get("isOnline") === "on",
      entryFee: parseFloat(formData.get("entryFee") as string) || 0,
      prizePool: formData.get("prizePool")
        ? parseFloat(formData.get("prizePool") as string)
        : null,
      status: formData.get("status") as string,
      seatConfig: seatConfig.generateSeats ? seatConfig : null,
    }

    try {
      const response = await fetch("/api/events", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to create event")
      }

      const event = await response.json()
      router.push(`/admin/events`)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleMaxParticipantsChange = (value: number) => {
    setMaxParticipants(value)
    if (seatConfig.generateSeats) {
      setSeatConfig(prev => ({
        ...prev,
        totalSeats: value,
        vipSeats: Math.min(prev.vipSeats, Math.floor(value * 0.2)) // Max 20% VIP
      }))
    }
  }

  const calculateRows = () => {
    return Math.ceil(seatConfig.totalSeats / seatConfig.seatsPerRow)
  }

  const getSeatPreview = () => {
    const rows = calculateRows()
    const preview = []
    for (let i = 0; i < Math.min(rows, 3); i++) {
      preview.push(i)
    }
    return preview
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <header>
        <h1 className="font-display text-3xl uppercase text-white">Create New Event</h1>
        <p className="mt-2 text-sm uppercase tracking-[0.3em] text-white/60">
          Set up a new tournament event
        </p>
      </header>

      {error && (
        <div className="rounded-lg border border-red-500/50 bg-red-500/10 p-4">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Information */}
        <section className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
          <h2 className="mb-6 font-display text-xl text-white">Basic Information</h2>
          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-white/80">
                Event Name *
              </label>
              <input
                type="text"
                name="name"
                required
                className="w-full rounded-lg border border-white/20 bg-white/10 px-4 py-3 text-white placeholder-white/40 focus:border-skunkd-cyan focus:outline-none focus:ring-2 focus:ring-skunkd-cyan/50"
                placeholder="Skunkd Showdown: Apex Legends"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-white/80">
                Game *
              </label>
              <input
                type="text"
                name="game"
                required
                className="w-full rounded-lg border border-white/20 bg-white/10 px-4 py-3 text-white placeholder-white/40 focus:border-skunkd-cyan focus:outline-none focus:ring-2 focus:ring-skunkd-cyan/50"
                placeholder="Apex Legends"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-white/80">
                Description
              </label>
              <textarea
                name="description"
                rows={4}
                className="w-full rounded-lg border border-white/20 bg-white/10 px-4 py-3 text-white placeholder-white/40 focus:border-skunkd-cyan focus:outline-none focus:ring-2 focus:ring-skunkd-cyan/50"
                placeholder="Enter event description..."
              />
            </div>
          </div>
        </section>

        {/* Date & Time */}
        <section className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
          <h2 className="mb-6 font-display text-xl text-white">Date & Time</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-white/80">
                Start Date *
              </label>
              <input
                type="datetime-local"
                name="startDate"
                required
                className="w-full rounded-lg border border-white/20 bg-white/10 px-4 py-3 text-white focus:border-skunkd-cyan focus:outline-none focus:ring-2 focus:ring-skunkd-cyan/50"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-white/80">
                End Date
              </label>
              <input
                type="datetime-local"
                name="endDate"
                className="w-full rounded-lg border border-white/20 bg-white/10 px-4 py-3 text-white focus:border-skunkd-cyan focus:outline-none focus:ring-2 focus:ring-skunkd-cyan/50"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-white/80">
                Registration Start *
              </label>
              <input
                type="datetime-local"
                name="registrationStart"
                required
                className="w-full rounded-lg border border-white/20 bg-white/10 px-4 py-3 text-white focus:border-skunkd-cyan focus:outline-none focus:ring-2 focus:ring-skunkd-cyan/50"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-white/80">
                Registration End *
              </label>
              <input
                type="datetime-local"
                name="registrationEnd"
                required
                className="w-full rounded-lg border border-white/20 bg-white/10 px-4 py-3 text-white focus:border-skunkd-cyan focus:outline-none focus:ring-2 focus:ring-skunkd-cyan/50"
              />
            </div>
          </div>
        </section>

        {/* Capacity & Rules */}
        <section className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
          <h2 className="mb-6 font-display text-xl text-white">Capacity & Rules</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-white/80">
                Max Participants *
              </label>
              <input
                type="number"
                name="maxParticipants"
                required
                min="1"
                value={maxParticipants}
                onChange={(e) => handleMaxParticipantsChange(parseInt(e.target.value))}
                className="w-full rounded-lg border border-white/20 bg-white/10 px-4 py-3 text-white focus:border-skunkd-cyan focus:outline-none focus:ring-2 focus:ring-skunkd-cyan/50"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-white/80">
                Team Size *
              </label>
              <input
                type="number"
                name="teamSize"
                required
                min="1"
                defaultValue="1"
                className="w-full rounded-lg border border-white/20 bg-white/10 px-4 py-3 text-white focus:border-skunkd-cyan focus:outline-none focus:ring-2 focus:ring-skunkd-cyan/50"
              />
              <p className="mt-1 text-xs text-white/50">1 for solo, 2+ for team events</p>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-white/80">
                Entry Fee ($)
              </label>
              <input
                type="number"
                name="entryFee"
                min="0"
                step="0.01"
                defaultValue="0"
                className="w-full rounded-lg border border-white/20 bg-white/10 px-4 py-3 text-white focus:border-skunkd-cyan focus:outline-none focus:ring-2 focus:ring-skunkd-cyan/50"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-white/80">
                Prize Pool ($)
              </label>
              <input
                type="number"
                name="prizePool"
                min="0"
                step="0.01"
                className="w-full rounded-lg border border-white/20 bg-white/10 px-4 py-3 text-white focus:border-skunkd-cyan focus:outline-none focus:ring-2 focus:ring-skunkd-cyan/50"
              />
            </div>
          </div>
        </section>

        {/* Venue */}
        <section className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
          <h2 className="mb-6 font-display text-xl text-white">Venue Information</h2>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                name="isOnline"
                id="isOnline"
                className="h-5 w-5 rounded border-white/20 bg-white/10 text-skunkd-cyan focus:ring-2 focus:ring-skunkd-cyan"
              />
              <label htmlFor="isOnline" className="text-sm font-medium text-white/80">
                Online Event
              </label>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-white/80">
                Venue Name
              </label>
              <input
                type="text"
                name="venue"
                className="w-full rounded-lg border border-white/20 bg-white/10 px-4 py-3 text-white placeholder-white/40 focus:border-skunkd-cyan focus:outline-none focus:ring-2 focus:ring-skunkd-cyan/50"
                placeholder="Skunkd Gaming Arena"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-white/80">
                Venue Address
              </label>
              <input
                type="text"
                name="venueAddress"
                className="w-full rounded-lg border border-white/20 bg-white/10 px-4 py-3 text-white placeholder-white/40 focus:border-skunkd-cyan focus:outline-none focus:ring-2 focus:ring-skunkd-cyan/50"
                placeholder="123 Gaming St, City, State 12345"
              />
            </div>
          </div>
        </section>

        {/* Seat Configuration */}
        <section className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="font-display text-xl text-white">Seat Configuration</h2>
            <label className="flex items-center gap-3 cursor-pointer">
              <span className="text-sm text-white/70">Auto-generate seats</span>
              <input
                type="checkbox"
                checked={seatConfig.generateSeats}
                onChange={(e) => setSeatConfig(prev => ({ ...prev, generateSeats: e.target.checked }))}
                className="h-5 w-5 rounded border-white/20 bg-white/10 text-skunkd-cyan focus:ring-2 focus:ring-skunkd-cyan"
              />
            </label>
          </div>

          {seatConfig.generateSeats && (
            <div className="space-y-6">
              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <label className="mb-2 block text-sm font-medium text-white/80">
                    Total Seats
                  </label>
                  <input
                    type="number"
                    value={seatConfig.totalSeats}
                    onChange={(e) => setSeatConfig(prev => ({ 
                      ...prev, 
                      totalSeats: parseInt(e.target.value) || 0,
                      vipSeats: Math.min(prev.vipSeats, Math.floor((parseInt(e.target.value) || 0) * 0.5))
                    }))}
                    min="1"
                    max={maxParticipants}
                    className="w-full rounded-lg border border-white/20 bg-white/10 px-4 py-3 text-white focus:border-skunkd-cyan focus:outline-none focus:ring-2 focus:ring-skunkd-cyan/50"
                  />
                  <p className="mt-1 text-xs text-white/50">Max: {maxParticipants}</p>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-white/80">
                    Seats Per Row
                  </label>
                  <input
                    type="number"
                    value={seatConfig.seatsPerRow}
                    onChange={(e) => setSeatConfig(prev => ({ ...prev, seatsPerRow: parseInt(e.target.value) || 1 }))}
                    min="1"
                    max="20"
                    className="w-full rounded-lg border border-white/20 bg-white/10 px-4 py-3 text-white focus:border-skunkd-cyan focus:outline-none focus:ring-2 focus:ring-skunkd-cyan/50"
                  />
                  <p className="mt-1 text-xs text-white/50">{calculateRows()} rows</p>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-white/80">
                    VIP Seats
                  </label>
                  <input
                    type="number"
                    value={seatConfig.vipSeats}
                    onChange={(e) => setSeatConfig(prev => ({ 
                      ...prev, 
                      vipSeats: Math.min(parseInt(e.target.value) || 0, Math.floor(prev.totalSeats * 0.5))
                    }))}
                    min="0"
                    max={Math.floor(seatConfig.totalSeats * 0.5)}
                    className="w-full rounded-lg border border-white/20 bg-white/10 px-4 py-3 text-white focus:border-skunkd-cyan focus:outline-none focus:ring-2 focus:ring-skunkd-cyan/50"
                  />
                  <p className="mt-1 text-xs text-white/50">First {seatConfig.vipSeats} seats</p>
                </div>
              </div>

              {/* Seat Preview */}
              <div className="rounded-lg border border-cyan-500/30 bg-cyan-500/5 p-4">
                <h3 className="mb-3 text-sm font-medium text-cyan-400">Preview (first 3 rows)</h3>
                <div className="space-y-2">
                  {getSeatPreview().map((rowIndex) => (
                    <div key={rowIndex} className="flex gap-1 items-center">
                      <span className="text-xs text-white/50 w-8">R{rowIndex + 1}</span>
                      <div className="flex gap-1 flex-wrap">
                        {Array.from({ length: Math.min(seatConfig.seatsPerRow, seatConfig.totalSeats - (rowIndex * seatConfig.seatsPerRow)) }).map((_, seatIndex) => {
                          const seatNumber = rowIndex * seatConfig.seatsPerRow + seatIndex + 1
                          const isVIP = seatNumber <= seatConfig.vipSeats
                          return (
                            <div
                              key={seatIndex}
                              className={`w-8 h-8 rounded border-2 flex items-center justify-center text-xs font-bold ${
                                isVIP 
                                  ? 'border-yellow-500/50 bg-yellow-500/20 text-yellow-300' 
                                  : 'border-white/30 bg-white/10 text-white/70'
                              }`}
                            >
                              {seatNumber}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  ))}
                  {calculateRows() > 3 && (
                    <p className="text-xs text-white/50 italic mt-2">
                      ... and {calculateRows() - 3} more rows
                    </p>
                  )}
                </div>
                
                <div className="mt-4 flex gap-4 text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded border-2 border-white/30 bg-white/10"></div>
                    <span className="text-white/70">Standard ({seatConfig.totalSeats - seatConfig.vipSeats})</span>
                  </div>
                  {seatConfig.vipSeats > 0 && (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded border-2 border-yellow-500/50 bg-yellow-500/20"></div>
                      <span className="text-white/70">VIP ({seatConfig.vipSeats})</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {!seatConfig.generateSeats && (
            <div className="rounded-lg border border-white/20 bg-white/5 p-6 text-center">
              <p className="text-white/70">
                Seats can be configured manually after event creation
              </p>
            </div>
          )}
        </section>

        {/* Status */}
        <section className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
          <h2 className="mb-6 font-display text-xl text-white">Event Status</h2>
          <div>
            <label className="mb-2 block text-sm font-medium text-white/80">Status *</label>
            <select
              name="status"
              required
              className="w-full rounded-lg border border-white/20 bg-white/10 px-4 py-3 text-white focus:border-skunkd-cyan focus:outline-none focus:ring-2 focus:ring-skunkd-cyan/50"
            >
              <option value="DRAFT">Draft</option>
              <option value="PUBLISHED">Published</option>
              <option value="REGISTRATION_OPEN">Registration Open</option>
            </select>
          </div>
        </section>

        {/* Submit */}
        <div className="flex gap-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="rounded-full border border-white/20 px-8 py-3 font-semibold uppercase tracking-wide text-white/80 transition hover:border-white/40 hover:text-white"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-full bg-skunkd-purple px-8 py-3 font-semibold uppercase tracking-wide text-white shadow-neon transition hover:bg-skunkd-magenta hover:shadow-cyan disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Creating..." : "Create Event"}
          </button>
        </div>
      </form>
    </div>
  )
}
