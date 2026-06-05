import type { NextApiRequest, NextApiResponse } from 'next'
import { createSession, getDb, hashPassword, toPublicUser } from '../../../lib/db'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { name, email, institute, password } = req.body ?? {}
  if (!name || !email || !institute || !password) {
    return res.status(400).json({ error: 'Name, email, institute, and password are required' })
  }

  try {
    const db = await getDb()
    const result = await db.query(`
      INSERT INTO users (name, email, institute, password_hash) 
      VALUES ($1, $2, $3, $4)
      RETURNING id
    `, [
      String(name).trim(), 
      String(email).trim().toLowerCase(), 
      String(institute).trim(), 
      hashPassword(String(password))
    ])

    const id = Number(result.rows[0].id)
    const token = await createSession(id)

    const isProd = process.env.NODE_ENV === 'production'
    res.setHeader(
      'Set-Cookie',
      `token=${token}; HttpOnly; Path=/; Max-Age=${60 * 60 * 24 * 7}; SameSite=Lax${isProd ? '; Secure' : ''}`
    )

    res.status(201).json({
      user: { 
        id, 
        name: String(name).trim(), 
        email: String(email).trim().toLowerCase(), 
        institute: String(institute).trim() 
      }
    })
  } catch (error: any) {
    if (error?.code === '23505' || String(error?.message).includes('UNIQUE') || String(error?.message).includes('duplicate key')) {
      return res.status(409).json({ error: 'An account with this email already exists' })
    }
    console.error(error)
    res.status(500).json({ error: 'Could not create account' })
  }
}
