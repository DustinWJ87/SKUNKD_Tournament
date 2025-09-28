    import Link from "next/link";

    const NAV_LINKS = [
      { href: "/events", label: "Events" },
      { href: "/seat-maps", label: "Seat Maps" },
      { href: "/admin", label: "Admin" },
    ];

    export function SkunkdShell({ children }: { children: React.ReactNode }) {
      return (
        <div className="relative flex min-h-screen flex-col overflow-hidden">
          <div className="pointer-events-none absolute inset-0 -z-10">
            <div className="absolute right-[-20%] top-[-30%] h-[40rem] w-[40rem] rounded-full
bg-gradient-to-br from-skunkd-purple/50 via-skunkd-magenta/40 to-transparent blur-[180px]" />
            <div className="absolute bottom-[-20%] left-[-10%] h-[35rem] w-[35rem] rounded-full
bg-gradient-to-tr from-skunkd-cyan/30 via-skunkd-purple/20 to-transparent blur-[160px]" />
          </div>

          <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6">
            <Link href="/" className="font-display text-2xl uppercase tracking-[0.4em] text-white">
              Skunkd
            </Link>
            <nav className="hidden items-center gap-8 text-sm uppercase tracking-[0.3em]
text-white/70 md:flex">
              {NAV_LINKS.map((link) => (
                <Link key={link.href} href={link.href} className="hover:text-white">
                  {link.label}
                </Link>
              ))}
            </nav>
            <Link
              href="/login"
              className="hidden rounded-full border border-white/20 px-4 py-2 text-xs uppercase
tracking-[0.2em] text-white/70 transition hover:border-skunkd-cyan hover:text-white md:inline-flex"
            >
              Log In
            </Link>
          </header>

          <main className="mx-auto w-full max-w-5xl flex-1 px-6 pb-16">{children}</main>

          <footer className="mx-auto w-full max-w-6xl px-6 pb-8 text-xs uppercase tracking-[0.3em]
text-white/40">
            © {new Date().getFullYear()} Skunkd Gaming. All rights reserved.
          </footer>
        </div>
      );
    }
