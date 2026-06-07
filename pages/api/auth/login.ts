import type { NextApiRequest, NextApiResponse } from 'next'
import { createSession, getDb, toPublicUser, verifyPassword } from '../../../lib/db'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  try {
    const { email, password } = req.body ?? {}
    if (!email || !password) return res.status(400).json({ error: 'Email and password are required' })

    const db = await getDb()
    const result = await db.query(`
      SELECT id, name, email, institute, password_hash, is_verified 
      FROM users 
      WHERE LOWER(email) = $1
    `, [String(email).trim().toLowerCase()])

    const user = result.rows[0]

    if (!user || !verifyPassword(String(password), user.password_hash)) {
      return res.status(401).json({ error: 'Invalid email or password' })
    }

    if (!user.is_verified) {
      return res.status(403).json({ error: 'Please verify your email address before logging in.' })
    }

    const token = await createSession(Number(user.id))
    const isProd = process.env.NODE_ENV === 'production'
    res.setHeader(
      'Set-Cookie',
      `token=${token}; HttpOnly; Path=/; Max-Age=${60 * 60 * 24 * 7}; SameSite=Lax${isProd ? '; Secure' : ''}`
    )
    res.status(200).json({ 
      user: { 
        id: Number(user.id), 
        name: user.name, 
        email: user.email, 
        institute: user.institute,
        is_verified: !!user.is_verified
      } 
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Could not log in' })
  }
}
