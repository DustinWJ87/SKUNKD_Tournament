import { prisma } from "./prisma"
import { NotificationType } from "@prisma/client"

interface CreateNotificationParams {
  userId: string
  type: NotificationType
  title: string
  message: string
  link?: string
  eventId?: string
  registrationId?: string
  teamId?: string
  metadata?: Record<string, unknown>
}

export async function createNotification(params: CreateNotificationParams) {
  try {
    return await prisma.notification.create({
      data: {
        userId: params.userId,
        type: params.type,
        title: params.title,
        message: params.message,
        link: params.link,
        eventId: params.eventId,
        registrationId: params.registrationId,
        teamId: params.teamId,
        metadata: params.metadata || null,
      },
    })
  } catch (error) {
    console.error("Failed to create notification:", error)
    return null
  }
}

export async function createBulkNotifications(
  userIds: string[],
  params: Omit<CreateNotificationParams, "userId">
) {
  try {
    const notifications = userIds.map((userId) => ({
      userId,
      type: params.type,
      title: params.title,
      message: params.message,
      link: params.link,
      eventId: params.eventId,
      registrationId: params.registrationId,
      teamId: params.teamId,
      metadata: params.metadata || null,
    }))

    await prisma.notification.createMany({
      data: notifications,
    })

    return notifications.length
  } catch (error) {
    console.error("Failed to create bulk notifications:", error)
    return 0
  }
}

export async function markNotificationAsRead(notificationId: string) {
  try {
    return await prisma.notification.update({
      where: { id: notificationId },
      data: {
        read: true,
        readAt: new Date(),
      },
    })
  } catch (error) {
    console.error("Failed to mark notification as read:", error)
    return null
  }
}

export async function markAllNotificationsAsRead(userId: string) {
  try {
    return await prisma.notification.updateMany({
      where: {
        userId,
        read: false,
      },
      data: {
        read: true,
        readAt: new Date(),
      },
    })
  } catch (error) {
    console.error("Failed to mark all notifications as read:", error)
    return null
  }
}
