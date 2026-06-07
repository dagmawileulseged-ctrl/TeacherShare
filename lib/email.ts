import { writeFileSync, mkdirSync, existsSync } from 'node:fs'
import path from 'node:path'
import nodemailer from 'nodemailer'

export async function sendEmail({
  to,
  subject,
  html,
  text,
  baseUrl,
}: {
  to: string
  subject: string
  html: string
  text: string
  baseUrl: string
}) {
  const smtpHost = process.env.SMTP_HOST
  const smtpPort = process.env.SMTP_PORT
  const smtpUser = process.env.SMTP_USER
  const smtpPassword = process.env.SMTP_PASSWORD

  // Try SMTP first (Gmail SMTP)
  if (smtpHost && smtpUser && smtpPassword) {
    try {
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: Number(smtpPort || 465),
        secure: Number(smtpPort || 465) === 465,
        auth: {
          user: smtpUser,
          pass: smtpPassword,
        },
      })

      const info = await transporter.sendMail({
        from: `"TeacherShare" <${smtpUser}>`,
        to,
        subject,
        html,
        text,
      })

      console.log(`Email successfully sent to ${to} via SMTP: ${info.messageId}`)
      return
    } catch (err) {
      console.error('SMTP sending error:', err)
    }
  }

  // Fallback 1: Resend API
  const resendApiKey = process.env.RESEND_API_KEY

  if (resendApiKey) {
    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: process.env.RESEND_FROM_EMAIL || 'TeacherShare <onboarding@resend.dev>',
          to,
          subject,
          html,
          text,
        }),
      })
      if (!response.ok) {
        const errData = await response.json()
        console.error('Failed to send email via Resend:', errData)
      } else {
        console.log(`Email successfully sent to ${to} via Resend`)
        return
      }
    } catch (err) {
      console.error('Resend API call error:', err)
    }
  }

  // Fallback 2: Save email locally as HTML in public/emails (for development only)
  const isProd = process.env.NODE_ENV === 'production'
  if (!isProd) {
    const emailsDir = path.join(process.cwd(), 'public', 'emails')
    try {
      if (!existsSync(emailsDir)) {
        mkdirSync(emailsDir, { recursive: true })
      }
      const safeFilename = `${Date.now()}-${to.replace(/[^a-zA-Z0-9]/g, '_')}.html`
      const filePath = path.join(emailsDir, safeFilename)

      const fullHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>${subject}</title>
        </head>
        <body style="background: #f4f6f8; padding: 20px; font-family: sans-serif;">
          <div style="max-width: 600px; margin: 0 auto; background: white; border: 1px solid #ddd; padding: 20px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
            <h2 style="color: #06231f; margin-top: 0;">TeacherShare Mock Mailer</h2>
            <p style="font-size: 14px; color: #555;">
              <strong>To:</strong> ${to}<br>
              <strong>Subject:</strong> ${subject}
            </p>
            <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
            <div style="color: #333; line-height: 1.6;">
              ${html}
            </div>
            <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
            <p style="font-size: 12px; color: #888; text-align: center; margin-bottom: 0;">
              This is a development email preview. In production, this will be sent directly to the user's inbox.
            </p>
          </div>
        </body>
        </html>
      `
      writeFileSync(filePath, fullHtml)
      console.log(`\n📧 [DEV ONLY] Email sent mock. Open in browser: ${baseUrl}/emails/${safeFilename}\n`)
    } catch (err) {
      console.error('Failed to write mock email file:', err)
    }
  }
}
