import type { NextApiRequest, NextApiResponse } from 'next'
import { getDb } from '../../../lib/db'

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  const material = getDb()
    .prepare(`
      SELECT materials.*, users.name AS uploader_name
      FROM materials
      JOIN users ON users.id = materials.uploader_id
      WHERE materials.id = ?
    `)
    .get(Number(req.query.id))

  if (!material) return res.status(404).json({ error: 'Material not found' })

  res.status(200).json({ material })
}
