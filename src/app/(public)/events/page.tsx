    import Link from "next/link";

    const MOCK_EVENTS = [
      {
        id: "1",
        name: "Skunkd Showdown: Apex Legends",
        date: "2025-11-10",
        seatsAvailable: 36,
        status: "Open",
      },
      {
        id: "2",
        name: "Valorant Night Ops",
        date: "2025-11-18",
        seatsAvailable: 0,
        status: "Waitlist",
      },
    ];

    export default function EventsPage() {
      return (
        <div className="space-y-10">
          <header className="flex flex-col gap-3">
            <h1 className="font-display text-3xl uppercase text-white">Upcoming Events</h1>
            <p className="text-sm uppercase tracking-[0.3em] text-white/60">
              Reserve your seat in the arena.
            </p>
          </header>

          <div className="grid gap-6 md:grid-cols-2">
            {MOCK_EVENTS.map((event) => (
              <Link
                key={event.id}
                href={`/events/${event.id}`}
                className="group flex flex-col gap-4 rounded-3xl border border-white/10 bg-white/5
p-6 backdrop-blur-sm transition hover:border-skunkd-cyan/60"
              >
                <div className="flex items-center justify-between">
                  <span className="rounded-full border border-white/20 px-3 py-1 text-xs uppercase
tracking-[0.3em] text-white/70">
                    {event.status}
                  </span>
                  <span className="text-sm text-white/70">
                    {new Date(event.date).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                </div>
                <h2 className="font-display text-2xl text-white">{event.name}</h2>
                <p className="text-sm text-white/70">
                  Seats remaining: {event.seatsAvailable}
                </p>
                <span className="text-xs uppercase tracking-[0.3em] text-skunkd-cyan opacity-0
transition group-hover:opacity-100">
                  View Details
                </span>
              </Link>
            ))}
          </div>
        </div>
      );
    }