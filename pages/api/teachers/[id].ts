import type { NextApiRequest, NextApiResponse } from 'next'
import { getDb } from '../../../lib/db'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  try {
    const name = decodeURIComponent(String(req.query.id ?? ''))
    const db = await getDb()

    const summaryRes = await db.query(`
      SELECT
        $1::text AS name,
        COALESCE(ROUND(AVG(score)::numeric, 1), 0.0) AS rating,
        COUNT(score)::integer AS rating_count,
        (
          SELECT COALESCE(STRING_AGG(DISTINCT institution, ','), '')
          FROM (
            SELECT institution FROM materials WHERE LOWER(teacher_name) = LOWER($2)
            UNION ALL
            SELECT institution FROM ratings WHERE LOWER(teacher_name) = LOWER($2)
          ) AS combined
        ) AS institutions
      FROM ratings
      WHERE LOWER(teacher_name) = LOWER($2)
    `, [name, name])
    const summary = summaryRes.rows[0]

    const materialsRes = await db.query(`
      SELECT * FROM materials 
      WHERE LOWER(teacher_name) = LOWER($1) 
      ORDER BY created_at DESC
    `, [name])

    const ratingsRes = await db.query(`
      SELECT 
        ratings.id, ratings.teacher_name, ratings.institution, ratings.course, ratings.school_year, ratings.score, ratings.comment, ratings.is_anonymous, ratings.created_at,
        CASE WHEN ratings.is_anonymous = TRUE THEN 'Anonymous Student' ELSE users.name END AS user_name
      FROM ratings
      LEFT JOIN users ON users.id = ratings.user_id
      WHERE LOWER(ratings.teacher_name) = LOWER($1)
      ORDER BY ratings.created_at DESC
    `, [name])

    res.status(200).json({ 
      teacher: summary, 
      materials: materialsRes.rows, 
      ratings: ratingsRes.rows 
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Could not fetch teacher profile' })
  }
}
