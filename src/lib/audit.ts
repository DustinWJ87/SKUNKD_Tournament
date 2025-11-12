import { prisma } from "./prisma"
import { AuditAction } from "@prisma/client"

interface AuditLogParams {
  action: AuditAction
  entityType: string
  entityId: string
  userId?: string
  userName?: string
  userRole?: string
  changes?: Record<string, unknown>
  metadata?: Record<string, unknown>
  ipAddress?: string
  userAgent?: string
}

export async function createAuditLog(params: AuditLogParams) {
  try {
    return await prisma.auditLog.create({
      data: {
        action: params.action,
        entityType: params.entityType,
        entityId: params.entityId,
        userId: params.userId,
        userName: params.userName,
        userRole: params.userRole,
        changes: params.changes || null,
        metadata: params.metadata || null,
        ipAddress: params.ipAddress,
        userAgent: params.userAgent,
      },
    })
  } catch (error) {
    console.error("Failed to create audit log:", error)
    // Don't throw - audit logging shouldn't break the main flow
    return null
  }
}

// Helper to extract IP and User Agent from NextRequest
export function getRequestInfo(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for")
  const ipAddress = forwarded ? forwarded.split(",")[0] : request.headers.get("x-real-ip") || "unknown"
  const userAgent = request.headers.get("user-agent") || "unknown"

  return { ipAddress, userAgent }
}

// Helper to capture changes between old and new objects
export function captureChanges<T extends Record<string, unknown>>(
  oldData: T,
  newData: Partial<T>
): Record<string, { from: unknown; to: unknown }> {
  const changes: Record<string, { from: unknown; to: unknown }> = {}

  for (const key in newData) {
    if (newData[key] !== oldData[key]) {
      changes[key] = {
        from: oldData[key],
        to: newData[key],
      }
    }
  }

  return changes
}
