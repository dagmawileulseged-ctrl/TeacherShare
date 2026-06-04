import type { NextApiRequest, NextApiResponse } from 'next'
import { getDb } from '../../../lib/db'

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  const topic = getDb()
    .prepare(`
      SELECT topics.*, users.name AS author_name,
        materials.file_name, materials.file_url, materials.file_type, materials.file_size,
        ratings.score, ratings.comment
      FROM topics
      JOIN users ON users.id = topics.author_id
      LEFT JOIN materials ON materials.id = topics.material_id
      LEFT JOIN ratings ON ratings.id = topics.rating_id
      WHERE topics.id = ?
    `)
    .get(Number(req.query.id))

  if (!topic) return res.status(404).json({ error: 'Topic not found' })

  res.status(200).json({ topic })
}
