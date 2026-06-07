import type { NextApiRequest, NextApiResponse } from 'next'
import { randomBytes } from 'node:crypto'
import { createSession, getDb, hashPassword } from '../../../lib/db'
import { sendEmail } from '../../../lib/email'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { name, email, institute, password } = req.body ?? {}
  if (!name || !email || !institute || !password) {
    return res.status(400).json({ error: 'Name, email, institute, and password are required' })
  }

  if (String(password).length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters long' })
  }

  try {
    const db = await getDb()
    const verificationToken = randomBytes(32).toString('hex')

    const result = await db.query(`
      INSERT INTO users (name, email, institute, password_hash, verification_token, is_verified) 
      VALUES ($1, $2, $3, $4, $5, FALSE)
      RETURNING id
    `, [
      String(name).trim(), 
      String(email).trim().toLowerCase(), 
      String(institute).trim(), 
      hashPassword(String(password)),
      verificationToken
    ])

    const id = Number(result.rows[0].id)

    // Send verification email
    const host = req.headers.host || 'localhost:3000'
    const protocol = req.headers['x-forwarded-proto'] || 'http'
    const baseUrl = `${protocol}://${host}`
    const verifyUrl = `${baseUrl}/auth/verify-email?token=${verificationToken}`

    await sendEmail({
      to: String(email).trim().toLowerCase(),
      subject: 'Verify your TeacherShare account',
      html: `
        <p>Hello ${String(name).trim()},</p>
        <p>Thank you for registering on TeacherShare. Please verify your email address by clicking the link below:</p>
        <p style="margin: 20px 0;"><a href="${verifyUrl}" style="background: #06231f; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block; font-weight: bold;">Verify Email Address</a></p>
        <p>Or copy and paste this URL into your browser:</p>
        <p style="color: #666; font-size: 13px;">${verifyUrl}</p>
      `,
      text: `Hello ${String(name).trim()},\n\nPlease verify your email address by visiting this link: ${verifyUrl}`,
      baseUrl
    })

    res.status(201).json({
      message: 'Registration successful! A verification email has been sent.',
      user: { 
        id, 
        name: String(name).trim(), 
        email: String(email).trim().toLowerCase(), 
        institute: String(institute).trim(),
        is_verified: false
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
