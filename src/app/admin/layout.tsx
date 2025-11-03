import { ReactNode } from "react"
import Link from "next/link"

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div>
      {/* Admin Sub-Navigation */}
      <div className="bg-gray-800/50 border-b border-gray-700 mb-8">
        <div className="container mx-auto px-4">
          <nav className="flex gap-6 overflow-x-auto">
            <Link
              href="/admin"
              className="py-4 px-2 text-sm font-medium text-gray-400 hover:text-white border-b-2 border-transparent hover:border-purple-500 transition-colors whitespace-nowrap"
            >
              Dashboard
            </Link>
            <Link
              href="/admin/events"
              className="py-4 px-2 text-sm font-medium text-gray-400 hover:text-white border-b-2 border-transparent hover:border-purple-500 transition-colors whitespace-nowrap"
            >
              Events
            </Link>
            <Link
              href="/admin/registrations"
              className="py-4 px-2 text-sm font-medium text-gray-400 hover:text-white border-b-2 border-transparent hover:border-purple-500 transition-colors whitespace-nowrap"
            >
              Registrations
            </Link>
            <Link
              href="/admin/users"
              className="py-4 px-2 text-sm font-medium text-gray-400 hover:text-white border-b-2 border-transparent hover:border-purple-500 transition-colors whitespace-nowrap"
            >
              Users
            </Link>
          </nav>
        </div>
      </div>
      {children}
    </div>
  )
}

