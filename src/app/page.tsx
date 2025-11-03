    import Link from "next/link";

    export default function HomePage() {
      return (
        <div className="space-y-10">
          <section className="flex flex-col gap-6 rounded-3xl border border-white/10
bg-gradient-to-br from-skunkd-charcoal via-skunkd-midnight to-black p-10 shadow-neon">
            <div className="flex flex-col gap-4">
              <span className="inline-flex w-fit items-center gap-2 rounded-full border
border-white/20 bg-white/10 px-4 py-1 text-xs uppercase tracking-[0.3em] text-white/80">
                Competitive Gaming Hub
              </span>
              <h1 className="font-display text-4xl uppercase text-white sm:text-5xl">
                Skunkd Tournament Control Center
              </h1>
              <p className="text-lg text-white/80">
                Manage events, design seat maps, and let players reserve their perfect spot in the
arena.
              </p>
            </div>
            <div className="flex flex-col gap-4 sm:flex-row">
              <Link
                href="/admin/events"
                className="inline-flex items-center justify-center rounded-full bg-skunkd-purple
px-6 py-3 font-semibold uppercase tracking-wide text-white shadow-neon transition
hover:bg-skunkd-magenta hover:shadow-cyan"
              >
                Go to Admin Console
              </Link>
              <Link
                href="/events"
                className="inline-flex items-center justify-center rounded-full border
border-white/20 px-6 py-3 font-semibold uppercase tracking-wide text-white/80 transition
hover:border-skunkd-cyan hover:text-white"
              >
                Browse Events
              </Link>
            </div>
          </section>
          <section className="grid gap-6 lg:grid-cols-3">
            {[
              {
                title: "Event Builder",
                description: "Craft events with custom seat configurations, registration windows, and team structures.",
              },
              {
                title: "Seat Designer",
                description: "Design arena layouts that mirror esports venues or custom pods with a drag-and-drop editor.",
              },
              {
                title: "Live Registration",
                description: "Track player signups in real time and move players between seats with administrative overrides.",
              },
            ].map((feature) => (
              <article
                key={feature.title}
                className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm transition hover:border-white/30"
              >
                <h2 className="font-display text-xl text-white">{feature.title}</h2>
                <p className="mt-3 text-sm text-white/70">{feature.description}</p>
              </article>
            ))}
          </section>
        </div>
      );
    }