import type { NextApiRequest, NextApiResponse } from 'next'
import { getDb } from '../../../lib/db'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  try {
    const db = await getDb()
    const result = await db.query(`
      SELECT 
        materials.id, materials.title, materials.institution, materials.course, materials.teacher_name, 
        materials.file_name, materials.file_url, materials.file_type, materials.file_size, materials.uploader_id, materials.created_at,
        users.name AS uploader_name
      FROM materials
      JOIN users ON users.id = materials.uploader_id
      WHERE materials.id = $1
    `, [Number(req.query.id)])

    const material = result.rows[0]

    if (!material) return res.status(404).json({ error: 'Material not found' })

    res.status(200).json({ material })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Could not fetch material details' })
  }
}
