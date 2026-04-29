import nodemailer from 'nodemailer'
import { AppConfig } from 'shared-types'

class NotificationServiceClass {
  private transporter: nodemailer.Transporter | null = null
  private initPromise: Promise<void> | null = null

  constructor() {
    this.initPromise = this.initTransporter()
  }

  private async initTransporter() {
    if (process.env.SMTP_HOST) {
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      })
    } else {
      // Create ethereal test account
      try {
        const account = await nodemailer.createTestAccount()
        this.transporter = nodemailer.createTransport({
          host: account.smtp.host,
          port: account.smtp.port,
          secure: account.smtp.secure,
          auth: {
            user: account.user,
            pass: account.pass,
          },
        })
        console.log('[NOTIFY] Initialized Ethereal SMTP account:', account.user)
      } catch (err) {
        console.error('[NOTIFY] Failed to initialize Ethereal SMTP', err)
      }
    }
  }

  public async ensureInitialized() {
    if (this.initPromise) {
      await this.initPromise
    }
  }

  public async send(
    appConfig: AppConfig,
    trigger: 'onCreate' | 'onUpdate' | 'onDelete',
    tableRef: string,
    rowData: Record<string, unknown>
  ): Promise<boolean> {
    await this.ensureInitialized()
    if (!this.transporter) return false

    const events = appConfig.notifications?.events || []
    const matchingEvents = events.filter((e) => e.trigger === trigger && e.tableRef === tableRef)

    if (matchingEvents.length === 0) return false

    let sent = false

    for (const event of matchingEvents) {
      let subject = event.template.subject
      let body = event.template.body

      // Replace {{fieldName}} placeholders
      for (const [key, value] of Object.entries(rowData)) {
        const regex = new RegExp(`{{${key}}}`, 'g')
        subject = subject.replace(regex, String(value))
        body = body.replace(regex, String(value))
      }

      try {
        const info = await this.transporter.sendMail({
          from: '"AppForge Alerts" <alerts@appforge.local>',
          to: 'admin@appforge.local', // Hardcoded admin for now since user email might not exist
          subject,
          text: body,
        })
        console.log(`[NOTIFY] Sent: "${subject}" to: admin@appforge.local`, info.messageId)
        if (nodemailer.getTestMessageUrl(info)) {
          console.log(`[NOTIFY] Preview URL: ${nodemailer.getTestMessageUrl(info)}`)
        }
        sent = true
      } catch (err) {
        console.error('[NOTIFY] Failed to send email', err)
      }
    }

    return sent
  }

  public async shutdown() {
    if (this.transporter) {
      this.transporter.close()
      this.transporter = null
      this.initPromise = null
    }
  }
}

export const NotificationService = new NotificationServiceClass()
