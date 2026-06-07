import type { NextApiRequest, NextApiResponse } from 'next'
import { getDb, hashPassword } from '../../../lib/db'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { token, password, confirmPassword } = req.body ?? {}
  
  if (!token) return res.status(400).json({ error: 'Reset token is required' })
  if (!password || !confirmPassword) return res.status(400).json({ error: 'Password and confirm password are required' })
  if (String(password).length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters long' })
  if (password !== confirmPassword) return res.status(400).json({ error: 'Passwords do not match' })

  try {
    const db = await getDb()

    // Find the user with the given reset token
    const result = await db.query(
      'SELECT id, reset_token_expires FROM users WHERE reset_token = $1',
      [token]
    )

    const user = result.rows[0]
    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired password reset link' })
    }

    const expires = new Date(user.reset_token_expires)
    if (expires.getTime() < Date.now()) {
      return res.status(400).json({ error: 'Your password reset link has expired' })
    }

    // Hash the new password
    const hashed = hashPassword(String(password))

    // Update password and clear reset token details
    await db.query(
      'UPDATE users SET password_hash = $1, reset_token = NULL, reset_token_expires = NULL WHERE id = $2',
      [hashed, user.id]
    )

    res.status(200).json({ message: 'Password has been reset successfully!' })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Could not reset password. Please try again later.' })
  }
}
