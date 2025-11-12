import { prisma } from "./prisma"
import { EmailStatus } from "@prisma/client"

/**
 * Email Service
 * 
 * This is a simple email service that logs emails to the database.
 * In production, you would integrate with a real email provider like:
 * - Resend (recommended): npm install resend
 * - SendGrid: npm install @sendgrid/mail
 * - Nodemailer: npm install nodemailer
 * 
 * For now, it logs emails for testing and development.
 */

interface EmailOptions {
  to: string | string[]
  subject: string
  html?: string
  text?: string
  template?: string
  variables?: Record<string, string>
}

export async function sendEmail(options: EmailOptions): Promise<boolean> {
  const recipients = Array.isArray(options.to) ? options.to : [options.to]
  
  try {
    // Get template if specified
    let html = options.html || ""
    let text = options.text || ""

    if (options.template) {
      const template = await prisma.emailTemplate.findUnique({
        where: { name: options.template },
      })

      if (template && template.isActive) {
        html = template.bodyHtml
        text = template.bodyText

        // Replace variables in template
        if (options.variables) {
          for (const [key, value] of Object.entries(options.variables)) {
            const placeholder = `{{${key}}}`
            html = html.replace(new RegExp(placeholder, "g"), value)
            text = text.replace(new RegExp(placeholder, "g"), value)
          }
        }
      }
    }

    // In development, just log the email
    console.log("\n📧 EMAIL NOTIFICATION")
    console.log("=".repeat(50))
    console.log(`To: ${recipients.join(", ")}`)
    console.log(`Subject: ${options.subject}`)
    console.log(`Template: ${options.template || "None"}`)
    console.log("-".repeat(50))
    console.log(text || html.replace(/<[^>]*>/g, "")) // Strip HTML tags for console
    console.log("=".repeat(50) + "\n")

    // Log to database
    for (const recipient of recipients) {
      await prisma.emailLog.create({
        data: {
          to: recipient,
          from: process.env.EMAIL_FROM || "noreply@skunkd.gg",
          subject: options.subject,
          template: options.template,
          status: EmailStatus.SENT, // In dev, mark as sent immediately
          provider: "development",
          metadata: {
            html: html.substring(0, 500), // Store snippet
            text: text.substring(0, 500),
            variables: options.variables,
          },
          sentAt: new Date(),
        },
      })
    }

    return true
  } catch (error) {
    console.error("Failed to send email:", error)

    // Log failed email
    for (const recipient of recipients) {
      await prisma.emailLog.create({
        data: {
          to: recipient,
          from: process.env.EMAIL_FROM || "noreply@skunkd.gg",
          subject: options.subject,
          template: options.template,
          status: EmailStatus.FAILED,
          provider: "development",
          error: error instanceof Error ? error.message : "Unknown error",
        },
      })
    }

    return false
  }
}

/**
 * Send registration confirmation email
 */
export async function sendRegistrationConfirmation(
  email: string,
  userName: string,
  eventName: string,
  eventId: string
) {
  return sendEmail({
    to: email,
    subject: `Registration Confirmed - ${eventName}`,
    template: "registration_confirmation",
    variables: {
      userName,
      eventName,
      eventUrl: `${process.env.NEXTAUTH_URL}/events/${eventId}`,
    },
  })
}

/**
 * Send registration approval email
 */
export async function sendRegistrationApproval(
  email: string,
  userName: string,
  eventName: string,
  eventId: string
) {
  return sendEmail({
    to: email,
    subject: `Registration Approved - ${eventName}`,
    template: "registration_approved",
    variables: {
      userName,
      eventName,
      eventUrl: `${process.env.NEXTAUTH_URL}/events/${eventId}`,
    },
  })
}

/**
 * Send event reminder email
 */
export async function sendEventReminder(
  email: string,
  userName: string,
  eventName: string,
  eventDate: string,
  eventId: string
) {
  return sendEmail({
    to: email,
    subject: `Reminder: ${eventName} is coming up!`,
    template: "event_reminder",
    variables: {
      userName,
      eventName,
      eventDate,
      eventUrl: `${process.env.NEXTAUTH_URL}/events/${eventId}`,
    },
  })
}

/**
 * Send event update notification
 */
export async function sendEventUpdate(
  email: string,
  userName: string,
  eventName: string,
  updateDetails: string,
  eventId: string
) {
  return sendEmail({
    to: email,
    subject: `Event Update - ${eventName}`,
    template: "event_update",
    variables: {
      userName,
      eventName,
      updateDetails,
      eventUrl: `${process.env.NEXTAUTH_URL}/events/${eventId}`,
    },
  })
}

/**
 * Send bracket match notification
 */
export async function sendMatchNotification(
  email: string,
  userName: string,
  eventName: string,
  opponent: string,
  matchTime: string,
  eventId: string
) {
  return sendEmail({
    to: email,
    subject: `Your Match is Scheduled - ${eventName}`,
    template: "match_notification",
    variables: {
      userName,
      eventName,
      opponent,
      matchTime,
      eventUrl: `${process.env.NEXTAUTH_URL}/events/${eventId}`,
    },
  })
}
