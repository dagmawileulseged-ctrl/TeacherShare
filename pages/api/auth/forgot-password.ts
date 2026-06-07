import type { NextApiRequest, NextApiResponse } from 'next'
import { randomBytes } from 'node:crypto'
import { getDb } from '../../../lib/db'
import { sendEmail } from '../../../lib/email'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { email } = req.body ?? {}
  if (!email) return res.status(400).json({ error: 'Email is required' })

  try {
    const db = await getDb()
    const result = await db.query(
      'SELECT id, name, email FROM users WHERE LOWER(email) = $1',
      [String(email).trim().toLowerCase()]
    )

    const user = result.rows[0]
    // To prevent user enumeration attacks, we return a 200 success message even if the user does not exist
    if (!user) {
      return res.status(200).json({ message: 'If an account exists with this email, a reset link has been sent.' })
    }

    const resetToken = randomBytes(32).toString('hex')
    const resetExpires = new Date(Date.now() + 1 * 60 * 60 * 1000) // 1 hour

    await db.query(
      'UPDATE users SET reset_token = $1, reset_token_expires = $2 WHERE id = $3',
      [resetToken, resetExpires, user.id]
    )

    const host = req.headers.host || 'localhost:3000'
    const protocol = req.headers['x-forwarded-proto'] || 'http'
    const baseUrl = `${protocol}://${host}`
    const resetUrl = `${baseUrl}/auth/reset-password?token=${resetToken}`

    await sendEmail({
      to: user.email,
      subject: 'Reset your TeacherShare password',
      html: `
        <p>Hello ${user.name},</p>
        <p>You requested a password reset for your TeacherShare account. Click the button below to set a new password:</p>
        <p style="margin: 20px 0;"><a href="${resetUrl}" style="background: #06231f; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block; font-weight: bold;">Reset Password</a></p>
        <p>This link will expire in 1 hour.</p>
        <p>If you did not request this, you can ignore this email and your password will remain unchanged.</p>
        <p style="color: #666; font-size: 13px;">${resetUrl}</p>
      `,
      text: `Hello ${user.name},\n\nYou requested a password reset for your TeacherShare account. Visit this link to set a new password: ${resetUrl}`,
      baseUrl
    })

    res.status(200).json({ message: 'If an account exists with this email, a reset link has been sent.' })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Could not request password reset' })
  }
}
