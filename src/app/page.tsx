'use client'

import Link from "next/link";
import { useSession } from "next-auth/react";

export default function HomePage() {
  const { data: session } = useSession()
  const user = session?.user as any
  const isAdminOrOrganizer = user?.role === 'ADMIN' || user?.role === 'ORGANIZER'

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
          {isAdminOrOrganizer ? (
            <Link
              href="/admin/events"
              className="inline-flex items-center justify-center rounded-full bg-skunkd-purple
px-6 py-3 font-semibold uppercase tracking-wide text-white shadow-neon transition
hover:bg-skunkd-magenta hover:shadow-cyan"
            >
              Go to Admin Console
            </Link>
          ) : (
            <Link
              href="/auth/signin"
              className="inline-flex items-center justify-center rounded-full bg-skunkd-purple
px-6 py-3 font-semibold uppercase tracking-wide text-white shadow-neon transition
hover:bg-skunkd-magenta hover:shadow-cyan"
            >
              Sign In
            </Link>
          )}
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
            icon: "🎮",
            href: isAdminOrOrganizer ? "/admin/events/create" : "/auth/signin",
            color: "cyan",
            requiresAuth: true,
          },
          {
            title: "Check-In System",
            description: "Streamline player check-ins with real-time status tracking and administrative controls for event day.",
            icon: "✅",
            href: isAdminOrOrganizer ? "/admin/events" : "/auth/signin",
            color: "purple",
            requiresAuth: true,
          },
          {
            title: "Live Registration",
            description: "Track player signups in real time and move players between seats with administrative overrides.",
            icon: "📝",
            href: isAdminOrOrganizer ? "/admin/registrations" : "/events",
            color: "magenta",
            requiresAuth: false,
          },
        ].map((feature) => (
          <Link
            key={feature.title}
            href={feature.href}
            className="group rounded-3xl border border-cyan-500/20 bg-midnight-800 p-6 backdrop-blur-sm transition-all hover:border-cyan-500/50 hover:bg-midnight-700 hover:scale-105 hover:shadow-lg hover:shadow-cyan-500/20"
          >
            <div className="flex items-center gap-3 mb-3">
              <span className="text-3xl">{feature.icon}</span>
              <h2 className="font-display text-xl text-cyan-400 group-hover:text-cyan-300 transition-colors">{feature.title}</h2>
            </div>
            <p className="text-sm text-gray-400 group-hover:text-gray-300 transition-colors">{feature.description}</p>
            <div className="mt-4 flex items-center gap-2 text-cyan-400 group-hover:text-cyan-300 text-sm font-medium">
              <span>{feature.requiresAuth && !isAdminOrOrganizer ? "Sign In to Access" : "Learn More"}</span>
              <span className="transition-transform group-hover:translate-x-1">→</span>
            </div>
          </Link>
        ))}
      </section>
    </div>
  );
}