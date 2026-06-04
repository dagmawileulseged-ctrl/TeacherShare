import type { NextApiRequest, NextApiResponse } from 'next'
import { createSession, getDb, hashPassword, toPublicUser } from '../../../lib/db'

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { name, email, institute, password } = req.body ?? {}
  if (!name || !email || !institute || !password) {
    return res.status(400).json({ error: 'Name, email, institute, and password are required' })
  }

  try {
    const result = getDb()
      .prepare('INSERT INTO users (name, email, institute, password_hash) VALUES (?, ?, ?, ?)')
      .run(String(name).trim(), String(email).trim().toLowerCase(), String(institute).trim(), hashPassword(String(password)))
    const id = Number(result.lastInsertRowid)
    const token = createSession(id)
    res.status(201).json(toPublicUser({ id, name: String(name).trim(), email: String(email).trim().toLowerCase(), institute: String(institute).trim() }, token))
  } catch (error: any) {
    if (String(error?.message).includes('UNIQUE')) {
      return res.status(409).json({ error: 'An account with this email already exists' })
    }
    res.status(500).json({ error: 'Could not create account' })
  }
}
