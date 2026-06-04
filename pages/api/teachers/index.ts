import type { NextApiRequest, NextApiResponse } from 'next'
import { getDb } from '../../../lib/db'

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  const teachers = getDb()
    .prepare(`
      SELECT
        teacher_name AS name,
        GROUP_CONCAT(DISTINCT institution) AS institutions,
        GROUP_CONCAT(DISTINCT course) AS courses,
        COALESCE(ROUND(AVG(score), 1), 0) AS rating,
        COUNT(score) AS rating_count
      FROM (
        SELECT teacher_name, institution, course, NULL AS score FROM materials
        UNION ALL
        SELECT teacher_name, institution, course, score FROM ratings
      )
      GROUP BY LOWER(teacher_name)
      ORDER BY rating_count DESC, name ASC
    `)
    .all()

  res.status(200).json({ teachers })
}
