"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";

const NAV_LINKS = [
  { href: "/events", label: "Events" },
  { href: "/seat-maps", label: "Seat Maps" },
  { href: "/dashboard", label: "Dashboard", authRequired: true },
  { href: "/admin", label: "Admin", adminOnly: true },
];

export function SkunkdShell({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();

  const getVisibleNavLinks = () => {
    return NAV_LINKS.filter((link) => {
      if (link.authRequired && !session) return false;
      if (
        link.adminOnly &&
        session?.user?.role !== "SUPERADMIN" &&
        session?.user?.role !== "EVENT_ORGANIZER"
      )
        return false;
      return true;
    });
  };

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute right-[-20%] top-[-30%] h-[40rem] w-[40rem] rounded-full bg-gradient-to-br from-skunkd-purple/50 via-skunkd-magenta/40 to-transparent blur-[180px]" />
        <div className="absolute bottom-[-20%] left-[-10%] h-[35rem] w-[35rem] rounded-full bg-gradient-to-tr from-skunkd-cyan/30 via-skunkd-purple/20 to-transparent blur-[160px]" />
      </div>

      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6">
        <Link href="/" className="font-display text-2xl uppercase tracking-[0.4em] text-white">
          Skunkd
        </Link>
        <nav className="hidden items-center gap-8 text-sm uppercase tracking-[0.3em] text-white/70 md:flex">
          {getVisibleNavLinks().map((link) => (
            <Link key={link.href} href={link.href} className="hover:text-white">
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-4">
          {status === "loading" ? (
            <div className="h-8 w-20 animate-pulse rounded bg-white/10" />
          ) : session ? (
            <div className="flex items-center gap-4">
              <span className="hidden text-xs text-white/70 md:inline">
                {session.user.name || session.user.email}
              </span>
              <button
                onClick={() => signOut()}
                className="rounded-full border border-white/20 px-4 py-2 text-xs uppercase tracking-[0.2em] text-white/70 transition hover:border-red-500 hover:text-red-400"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <Link
              href="/auth/signin"
              className="rounded-full border border-white/20 px-4 py-2 text-xs uppercase tracking-[0.2em] text-white/70 transition hover:border-skunkd-cyan hover:text-white"
            >
              Sign In
            </Link>
          )}
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-6 pb-16">{children}</main>

      <footer className="mx-auto w-full max-w-6xl px-6 pb-8 text-xs uppercase tracking-[0.3em] text-white/40">
        © {new Date().getFullYear()} Skunkd Gaming. All rights reserved.
      </footer>
    </div>
  );
}