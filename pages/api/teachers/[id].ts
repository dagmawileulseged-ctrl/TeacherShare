import type { NextApiRequest, NextApiResponse } from 'next'
import { getDb } from '../../../lib/db'

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  const name = decodeURIComponent(String(req.query.id ?? ''))
  const db = getDb()
  const summary = db
    .prepare(`
      SELECT
        ? AS name,
        COALESCE(ROUND(AVG(score), 1), 0) AS rating,
        COUNT(score) AS rating_count
      FROM ratings
      WHERE LOWER(teacher_name) = LOWER(?)
    `)
    .get(name, name)

  const materials = db
    .prepare('SELECT * FROM materials WHERE LOWER(teacher_name) = LOWER(?) ORDER BY created_at DESC')
    .all(name)

  const ratings = db
    .prepare(`
      SELECT ratings.*, users.name AS user_name
      FROM ratings
      JOIN users ON users.id = ratings.user_id
      WHERE LOWER(teacher_name) = LOWER(?)
      ORDER BY ratings.created_at DESC
    `)
    .all(name)

  res.status(200).json({ teacher: summary, materials, ratings })
}
