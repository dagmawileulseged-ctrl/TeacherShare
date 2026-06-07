import type { NextApiRequest, NextApiResponse } from 'next'
import { getDb } from '../../../lib/db'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const token = String(req.query.token || req.body?.token || '').trim()
  if (!token) return res.status(400).json({ error: 'Verification token is required' })

  try {
    const db = await getDb()
    
    // Check if a user with this verification token exists
    const result = await db.query(
      'SELECT id FROM users WHERE verification_token = $1',
      [token]
    )

    const user = result.rows[0]
    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired verification token' })
    }

    // Set is_verified = TRUE and clear verification_token
    await db.query(
      'UPDATE users SET is_verified = TRUE, verification_token = NULL WHERE id = $1',
      [user.id]
    )

    res.status(200).json({ message: 'Email verified successfully!' })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Could not verify email' })
  }
}
