"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";

interface DashboardStats {
  totalEvents: number;
  activeEvents: number;
  totalRegistrations: number;
  totalSeatMaps: number;
}

export default function AdminDashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats>({
    totalEvents: 0,
    activeEvents: 0,
    totalRegistrations: 0,
    totalSeatMaps: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "loading") return;
    if (!session || (session.user?.role !== "SUPERADMIN" && session.user?.role !== "EVENT_ORGANIZER")) {
      router.push("/auth/signin");
      return;
    }

    fetchDashboardStats();
  }, [session, status, router]);

  const fetchDashboardStats = async () => {
    try {
      // Fetch events
      const eventsResponse = await fetch("/api/events");
      const events = eventsResponse.ok ? await eventsResponse.json() : [];
      
      // Fetch seat maps
      const seatMapsResponse = await fetch("/api/seat-maps");
      const seatMaps = seatMapsResponse.ok ? await seatMapsResponse.json() : [];
      
      // Fetch registrations
      const registrationsResponse = await fetch("/api/registrations");
      const registrations = registrationsResponse.ok ? await registrationsResponse.json() : [];

      const activeEvents = events.filter((event: any) => 
        event.status === "PUBLISHED" || 
        event.status === "REGISTRATION_OPEN" || 
        event.status === "IN_PROGRESS"
      ).length;

      setStats({
        totalEvents: events.length,
        activeEvents,
        totalRegistrations: registrations.length,
        totalSeatMaps: seatMaps.length,
      });
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
    } finally {
      setLoading(false);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  if (!session || (session.user?.role !== "SUPERADMIN" && session.user?.role !== "EVENT_ORGANIZER")) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Admin Dashboard</h1>
          <p className="text-purple-200">Welcome back, {session.user?.name || session.user?.email}</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-black/20 backdrop-blur-sm rounded-lg border border-purple-500/20 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-200 text-sm font-medium">Total Events</p>
                <p className="text-3xl font-bold text-white">{stats.totalEvents}</p>
              </div>
              <div className="p-3 bg-purple-600/20 rounded-lg">
                <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-black/20 backdrop-blur-sm rounded-lg border border-green-500/20 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-200 text-sm font-medium">Active Events</p>
                <p className="text-3xl font-bold text-white">{stats.activeEvents}</p>
              </div>
              <div className="p-3 bg-green-600/20 rounded-lg">
                <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-black/20 backdrop-blur-sm rounded-lg border border-blue-500/20 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-200 text-sm font-medium">Total Registrations</p>
                <p className="text-3xl font-bold text-white">{stats.totalRegistrations}</p>
              </div>
              <div className="p-3 bg-blue-600/20 rounded-lg">
                <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-black/20 backdrop-blur-sm rounded-lg border border-yellow-500/20 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-yellow-200 text-sm font-medium">Seat Maps</p>
                <p className="text-3xl font-bold text-white">{stats.totalSeatMaps}</p>
              </div>
              <div className="p-3 bg-yellow-600/20 rounded-lg">
                <svg className="w-6 h-6 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-black/20 backdrop-blur-sm rounded-lg border border-purple-500/20 p-6">
            <h2 className="text-2xl font-bold text-white mb-4">Quick Actions</h2>
            <div className="space-y-4">
              <Link
                href="/admin/events/create"
                className="flex items-center p-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-lg transition-all transform hover:scale-105"
              >
                <svg className="w-6 h-6 text-white mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <div>
                  <p className="text-white font-semibold">Create New Event</p>
                  <p className="text-purple-200 text-sm">Set up a new tournament</p>
                </div>
              </Link>

              <Link
                href="/seat-maps/create"
                className="flex items-center p-4 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 rounded-lg transition-all transform hover:scale-105"
              >
                <svg className="w-6 h-6 text-white mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
                <div>
                  <p className="text-white font-semibold">Create Seat Map</p>
                  <p className="text-blue-200 text-sm">Design a new venue layout</p>
                </div>
              </Link>

              <Link
                href="/admin/events"
                className="flex items-center p-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 rounded-lg transition-all transform hover:scale-105"
              >
                <svg className="w-6 h-6 text-white mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <div>
                  <p className="text-white font-semibold">Manage Events</p>
                  <p className="text-green-200 text-sm">View and edit existing events</p>
                </div>
              </Link>
            </div>
          </div>

          <div className="bg-black/20 backdrop-blur-sm rounded-lg border border-purple-500/20 p-6">
            <h2 className="text-2xl font-bold text-white mb-4">System Overview</h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-black/20 rounded-lg">
                <span className="text-purple-200">Platform Status</span>
                <span className="px-3 py-1 bg-green-600/20 text-green-400 rounded-full text-sm font-medium">
                  Online
                </span>
              </div>
              
              <div className="flex justify-between items-center p-3 bg-black/20 rounded-lg">
                <span className="text-purple-200">Database</span>
                <span className="px-3 py-1 bg-green-600/20 text-green-400 rounded-full text-sm font-medium">
                  Connected
                </span>
              </div>
              
              <div className="flex justify-between items-center p-3 bg-black/20 rounded-lg">
                <span className="text-purple-200">Authentication</span>
                <span className="px-3 py-1 bg-green-600/20 text-green-400 rounded-full text-sm font-medium">
                  Active
                </span>
              </div>

              <div className="mt-6 p-4 bg-gradient-to-r from-purple-600/20 to-pink-600/20 rounded-lg border border-purple-500/30">
                <h3 className="text-white font-semibold mb-2">Admin Privileges</h3>
                <ul className="text-purple-200 text-sm space-y-1">
                  <li>• Create and manage events</li>
                  <li>• Design seat maps</li>
                  <li>• View all registrations</li>
                  <li>• Access system analytics</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}