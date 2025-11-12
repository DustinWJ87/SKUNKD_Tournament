"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"

interface AuditLog {
  id: string
  action: string
  entityType: string
  entityId: string
  userId: string | null
  userName: string | null
  userRole: string | null
  changes: Record<string, unknown> | null
  metadata: Record<string, unknown> | null
  ipAddress: string | null
  userAgent: string | null
  createdAt: string
}

interface PaginationInfo {
  page: number
  limit: number
  total: number
  totalPages: number
}

export default function AuditLogsPage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0,
  })
  const [loading, setLoading] = useState(true)
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null)

  // Filters
  const [filters, setFilters] = useState({
    action: "",
    entityType: "",
    userId: "",
    entityId: "",
    startDate: "",
    endDate: "",
  })

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin")
    } else if (session?.user?.role !== "ADMIN") {
      router.push("/admin")
    }
  }, [status, session, router])

  useEffect(() => {
    if (status === "authenticated") {
      fetchLogs()
    }
  }, [status, pagination.page, filters])

  async function fetchLogs() {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      })

      if (filters.action) params.append("action", filters.action)
      if (filters.entityType) params.append("entityType", filters.entityType)
      if (filters.userId) params.append("userId", filters.userId)
      if (filters.entityId) params.append("entityId", filters.entityId)
      if (filters.startDate) params.append("startDate", filters.startDate)
      if (filters.endDate) params.append("endDate", filters.endDate)

      const res = await fetch(`/api/admin/audit-logs?${params}`)
      if (res.ok) {
        const data = await res.json()
        setLogs(data.logs)
        setPagination(data.pagination)
      }
    } catch (error) {
      console.error("Failed to fetch audit logs:", error)
    } finally {
      setLoading(false)
    }
  }

  function handleFilterChange(key: string, value: string) {
    setFilters((prev) => ({ ...prev, [key]: value }))
    setPagination((prev) => ({ ...prev, page: 1 })) // Reset to page 1 on filter change
  }

  function exportLogs() {
    // Export current logs to JSON
    const dataStr = JSON.stringify(logs, null, 2)
    const dataBlob = new Blob([dataStr], { type: "application/json" })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement("a")
    link.href = url
    link.download = `audit-logs-${new Date().toISOString()}.json`
    link.click()
  }

  if (status === "loading" || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-midnight-900">
        <div className="text-lg text-gray-400">Loading audit logs...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-midnight-900 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 sm:gap-6 mb-8">
          <div className="flex-1 min-w-0">
            <h1 className="text-3xl sm:text-4xl font-bold text-cyan-400 mb-2">Audit Logs</h1>
            <p className="text-gray-400 text-sm sm:text-base">System activity and change tracking</p>
          </div>
          <button
            onClick={exportLogs}
            className="bg-cyan-500/20 text-cyan-400 px-4 py-2 rounded-lg hover:bg-cyan-500/30 transition-colors border border-cyan-500/20 whitespace-nowrap sm:self-start"
          >
            Export Logs
          </button>
        </div>

      {/* Filters */}
      <div className="bg-midnight-800 rounded-lg border border-cyan-500/20 p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4 text-cyan-400">Filters</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-400">Action</label>
            <select
              value={filters.action}
              onChange={(e) => handleFilterChange("action", e.target.value)}
              className="w-full bg-midnight-900 border border-cyan-500/20 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
            >
              <option value="">All Actions</option>
              <option value="USER_CREATED">User Created</option>
              <option value="USER_UPDATED">User Updated</option>
              <option value="USER_DELETED">User Deleted</option>
              <option value="EVENT_CREATED">Event Created</option>
              <option value="EVENT_UPDATED">Event Updated</option>
              <option value="EVENT_PUBLISHED">Event Published</option>
              <option value="REGISTRATION_APPROVED">Registration Approved</option>
              <option value="REGISTRATION_REJECTED">Registration Rejected</option>
              <option value="PAYMENT_RECEIVED">Payment Received</option>
              <option value="REFUND_ISSUED">Refund Issued</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-gray-400">Entity Type</label>
            <input
              type="text"
              value={filters.entityType}
              onChange={(e) => handleFilterChange("entityType", e.target.value)}
              placeholder="e.g., Event, User"
              className="w-full bg-midnight-900 border border-cyan-500/20 rounded-lg px-3 py-2 text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-gray-400">User ID</label>
            <input
              type="text"
              value={filters.userId}
              onChange={(e) => handleFilterChange("userId", e.target.value)}
              placeholder="Filter by user"
              className="w-full bg-midnight-900 border border-cyan-500/20 rounded-lg px-3 py-2 text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-gray-400">Entity ID</label>
            <input
              type="text"
              value={filters.entityId}
              onChange={(e) => handleFilterChange("entityId", e.target.value)}
              placeholder="Filter by entity"
              className="w-full bg-midnight-900 border border-cyan-500/20 rounded-lg px-3 py-2 text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-gray-400">Start Date</label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => handleFilterChange("startDate", e.target.value)}
              className="w-full bg-midnight-900 border border-cyan-500/20 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-gray-400">End Date</label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => handleFilterChange("endDate", e.target.value)}
              className="w-full bg-midnight-900 border border-cyan-500/20 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
            />
          </div>
        </div>

        <div className="mt-4 flex gap-2">
          <button
            onClick={() => {
              setFilters({
                action: "",
                entityType: "",
                userId: "",
                entityId: "",
                startDate: "",
                endDate: "",
              })
            }}
            className="text-sm text-gray-400 hover:text-cyan-400 transition-colors"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-midnight-800 rounded-lg border border-cyan-500/20 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-midnight-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Timestamp</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Action</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Entity</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">User</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">IP Address</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cyan-500/20">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-midnight-700">
                  <td className="px-6 py-4 text-sm text-gray-400">
                    {new Date(log.createdAt).toLocaleString()}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded ${
                        log.action.includes("CREATED")
                          ? "bg-green-100 text-green-800"
                          : log.action.includes("DELETED")
                          ? "bg-red-100 text-red-800"
                          : log.action.includes("UPDATED")
                          ? "bg-blue-100 text-blue-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {log.action.replace(/_/g, " ")}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <div className="font-medium text-white">{log.entityType}</div>
                    <div className="text-gray-500 text-xs truncate max-w-xs">
                      {log.entityId}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-white">
                    {log.userName || "System"}
                    {log.userRole && (
                      <div className="text-xs text-gray-400">{log.userRole}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-400">
                    {log.ipAddress || "-"}
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => setSelectedLog(log)}
                      className="text-cyan-400 hover:text-cyan-300 text-sm"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-6 py-4 border-t border-cyan-500/20 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-sm text-gray-400">
            Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
            {Math.min(pagination.page * pagination.limit, pagination.total)} of{" "}
            {pagination.total} logs
          </div>
          <div className="flex gap-2 items-center">
            <button
              onClick={() =>
                setPagination((prev) => ({ ...prev, page: prev.page - 1 }))
              }
              disabled={pagination.page === 1}
              className="px-3 py-1 bg-midnight-700 border border-cyan-500/20 rounded-lg text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-midnight-600"
            >
              Previous
            </button>
            <span className="px-3 py-1 text-gray-400">
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <button
              onClick={() =>
                setPagination((prev) => ({ ...prev, page: prev.page + 1 }))
              }
              disabled={pagination.page === pagination.totalPages}
              className="px-3 py-1 bg-midnight-700 border border-cyan-500/20 rounded-lg text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-midnight-600"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Log Detail Modal */}
      {selectedLog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-midnight-800 border border-cyan-500/20 rounded-lg max-w-3xl w-full max-h-[80vh] overflow-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-2xl font-bold text-cyan-400">Audit Log Details</h2>
                <button
                  onClick={() => setSelectedLog(null)}
                  className="text-gray-400 hover:text-white"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-400">Action</label>
                  <p className="text-lg text-white">{selectedLog.action.replace(/_/g, " ")}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-400">Timestamp</label>
                  <p className="text-white">{new Date(selectedLog.createdAt).toLocaleString()}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-400">Entity</label>
                  <p className="text-white">
                    {selectedLog.entityType} - {selectedLog.entityId}
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-400">User</label>
                  <p className="text-white">
                    {selectedLog.userName || "System"}
                    {selectedLog.userRole && ` (${selectedLog.userRole})`}
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-400">IP Address</label>
                  <p className="text-white">{selectedLog.ipAddress || "N/A"}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-400">User Agent</label>
                  <p className="text-sm text-gray-400 break-all">{selectedLog.userAgent || "N/A"}</p>
                </div>

                {selectedLog.changes && (
                  <div>
                    <label className="text-sm font-medium text-gray-400">Changes</label>
                    <pre className="bg-midnight-900 border border-cyan-500/20 p-4 rounded-lg text-sm overflow-auto text-gray-300">
                      {JSON.stringify(selectedLog.changes, null, 2)}
                    </pre>
                  </div>
                )}

                {selectedLog.metadata && (
                  <div>
                    <label className="text-sm font-medium text-gray-400">Metadata</label>
                    <pre className="bg-midnight-900 border border-cyan-500/20 p-4 rounded-lg text-sm overflow-auto text-gray-300">
                      {JSON.stringify(selectedLog.metadata, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
    </div>
  )
}
