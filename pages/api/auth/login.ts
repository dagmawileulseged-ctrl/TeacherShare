import type { NextApiRequest, NextApiResponse } from 'next'
import { createSession, getDb, toPublicUser, verifyPassword } from '../../../lib/db'

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { email, password } = req.body ?? {}
  if (!email || !password) return res.status(400).json({ error: 'Email and password are required' })

  const user = getDb()
    .prepare('SELECT id, name, email, institute, password_hash FROM users WHERE email = ?')
    .get(String(email).trim().toLowerCase()) as any

  if (!user || !verifyPassword(String(password), user.password_hash)) {
    return res.status(401).json({ error: 'Invalid email or password' })
  }

  const token = createSession(Number(user.id))
  res.status(200).json(toPublicUser({ id: Number(user.id), name: user.name, email: user.email, institute: user.institute }, token))
}
