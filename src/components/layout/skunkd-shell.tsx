    "use client"

    import Link from "next/link";
    import { useSession, signOut } from "next-auth/react";
    import { usePathname } from "next/navigation";
    import { NotificationBell } from "@/components/notifications/notification-bell";
    import { useState } from "react";

    const NAV_LINKS = [
      { href: "/events", label: "Events", icon: "🏆" },
      { href: "/teams", label: "Teams", icon: "👥" },
      { href: "/profile", label: "Profile", icon: "👤" },
    ];

    const ADMIN_LINKS = [
      { href: "/admin", label: "Admin", icon: "⚙️" },
    ];

    export function SkunkdShell({ children }: { children: React.ReactNode }) {
      const { data: session, status } = useSession();
      const pathname = usePathname();
      const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
      
      const isAdmin = session?.user && (session.user as any).role === "ADMIN";
      const allLinks = isAdmin ? [...NAV_LINKS, ...ADMIN_LINKS] : NAV_LINKS;
      
      return (
        <div className="relative flex min-h-screen flex-col overflow-hidden pb-16 md:pb-0">
          <div className="pointer-events-none absolute inset-0 -z-10">
            <div className="absolute right-[-20%] top-[-30%] h-[40rem] w-[40rem] rounded-full
bg-gradient-to-br from-skunkd-purple/50 via-skunkd-magenta/40 to-transparent blur-[180px]" />
            <div className="absolute bottom-[-20%] left-[-10%] h-[35rem] w-[35rem] rounded-full
bg-gradient-to-tr from-skunkd-cyan/30 via-skunkd-purple/20 to-transparent blur-[160px]" />
          </div>

          {/* Desktop Header */}
          <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4 md:px-6 md:py-6">
            <Link href="/" className="font-display text-xl md:text-2xl uppercase tracking-[0.4em] text-white">
              Skunkd
            </Link>
            
            {/* Desktop Navigation */}
            <nav className="hidden items-center gap-6 lg:gap-8 text-sm uppercase tracking-[0.3em]
text-white/70 md:flex">
              {allLinks.map((link) => (
                <Link 
                  key={link.href} 
                  href={link.href} 
                  className={`hover:text-white transition-colors ${
                    pathname?.startsWith(link.href) ? 'text-white' : ''
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            {/* Desktop Auth */}
            <div className="hidden md:flex items-center gap-4">
              {status === "loading" ? (
                <div className="flex items-center gap-3">
                  <Link
                    href="/auth/signup"
                    className="text-xs uppercase tracking-[0.2em] text-white/70 transition hover:text-white"
                  >
                    Sign Up
                  </Link>
                  <Link
                    href="/auth/signin"
                    className="rounded-full border border-white/20 px-4 py-2 text-xs uppercase tracking-[0.2em] text-white/70 transition hover:border-skunkd-cyan hover:text-white"
                  >
                    Sign In
                  </Link>
                </div>
              ) : session ? (
                <>
                  <NotificationBell />
                  <span className="text-xs uppercase tracking-[0.2em] text-white/70">
                    {session.user?.name || (session.user as any)?.username}
                  </span>
                  <button
                    onClick={() => signOut()}
                    className="rounded-full border border-white/20 px-4 py-2 text-xs uppercase tracking-[0.2em] text-white/70 transition hover:border-red-500 hover:text-red-400"
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <div className="flex items-center gap-3">
                  <Link
                    href="/auth/signup"
                    className="text-xs uppercase tracking-[0.2em] text-white/70 transition hover:text-white"
                  >
                    Sign Up
                  </Link>
                  <Link
                    href="/auth/signin"
                    className="rounded-full border border-white/20 px-4 py-2 text-xs uppercase tracking-[0.2em] text-white/70 transition hover:border-skunkd-cyan hover:text-white"
                  >
                    Sign In
                  </Link>
                </div>
              )}
            </div>

            {/* Mobile Menu Button & Notifications */}
            <div className="flex md:hidden items-center gap-3">
              {session && <NotificationBell />}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 text-white/70 hover:text-white transition-colors"
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                )}
              </button>
            </div>
          </header>

          {/* Mobile Menu Dropdown */}
          {mobileMenuOpen && (
            <div className="md:hidden fixed inset-0 z-50 bg-black/95 backdrop-blur-sm">
              <div className="flex flex-col h-full">
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-4 border-b border-white/10">
                  <span className="font-display text-xl uppercase tracking-[0.4em] text-white">Menu</span>
                  <button
                    onClick={() => setMobileMenuOpen(false)}
                    className="p-2 text-white/70 hover:text-white transition-colors"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Navigation Links */}
                <nav className="flex-1 overflow-y-auto px-4 py-6">
                  {session && (
                    <div className="mb-6 pb-6 border-b border-white/10">
                      <div className="text-xs uppercase tracking-[0.2em] text-white/40 mb-2">Logged in as</div>
                      <div className="text-lg text-white">{session.user?.name || (session.user as any)?.username}</div>
                    </div>
                  )}
                  
                  <div className="space-y-2">
                    {allLinks.map((link) => (
                      <Link
                        key={link.href}
                        href={link.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`flex items-center gap-4 px-4 py-4 rounded-lg text-lg transition-colors ${
                          pathname?.startsWith(link.href)
                            ? 'bg-purple-600/20 text-white'
                            : 'text-white/70 hover:bg-white/5 hover:text-white'
                        }`}
                      >
                        <span className="text-2xl">{link.icon}</span>
                        <span className="uppercase tracking-wider">{link.label}</span>
                      </Link>
                    ))}
                  </div>

                  {/* Auth Actions */}
                  <div className="mt-8 pt-6 border-t border-white/10 space-y-2">
                    {session ? (
                      <button
                        onClick={() => {
                          signOut();
                          setMobileMenuOpen(false);
                        }}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg border border-red-500/50 text-red-400 hover:bg-red-500/10 transition-colors"
                      >
                        <span>Sign Out</span>
                      </button>
                    ) : (
                      <>
                        <Link
                          href="/auth/signin"
                          onClick={() => setMobileMenuOpen(false)}
                          className="block w-full px-4 py-3 rounded-lg border border-purple-500/50 text-center text-purple-400 hover:bg-purple-500/10 transition-colors"
                        >
                          Sign In
                        </Link>
                        <Link
                          href="/auth/signup"
                          onClick={() => setMobileMenuOpen(false)}
                          className="block w-full px-4 py-3 rounded-lg bg-purple-600 text-center text-white hover:bg-purple-700 transition-colors"
                        >
                          Sign Up
                        </Link>
                      </>
                    )}
                  </div>
                </nav>
              </div>
            </div>
          )}

          <main className="mx-auto w-full max-w-5xl flex-1 px-4 md:px-6 pb-4">{children}</main>

          {/* Mobile Bottom Navigation */}
          {session && (
            <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-gray-900/95 backdrop-blur-sm border-t border-white/10 safe-area-bottom">
              <div className="flex items-center justify-around px-2 py-2">
                {NAV_LINKS.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`flex flex-col items-center gap-1 px-4 py-2 rounded-lg min-w-[60px] transition-colors ${
                      pathname?.startsWith(link.href)
                        ? 'text-purple-400'
                        : 'text-white/50'
                    }`}
                  >
                    <span className="text-xl">{link.icon}</span>
                    <span className="text-xs uppercase tracking-wider">{link.label}</span>
                  </Link>
                ))}
              </div>
            </nav>
          )}

          <footer className="mx-auto w-full max-w-6xl px-4 md:px-6 pb-4 md:pb-8 text-xs uppercase tracking-[0.3em]
text-white/40">
            © {new Date().getFullYear()} Skunkd Gaming. All rights reserved.
          </footer>
        </div>
      );
    }
