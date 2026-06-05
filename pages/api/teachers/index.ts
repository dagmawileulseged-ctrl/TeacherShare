import type { NextApiRequest, NextApiResponse } from 'next'
import { getDb } from '../../../lib/db'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  try {
    const db = await getDb()
    const search = String(req.query.search ?? '').trim()
    const limit = Math.min(Math.max(parseInt(String(req.query.limit ?? '10')), 1), 50)
    const page = Math.max(parseInt(String(req.query.page ?? '1')), 1)
    const offset = (page - 1) * limit

    const where = search ? 'WHERE teacher_name ILIKE $1 OR institution ILIKE $1 OR course ILIKE $1' : ''
    const params = search ? [`%${search}%`] : []

    // Get total count
    const countRes = await db.query(`
      SELECT COUNT(DISTINCT LOWER(combined.teacher_name))::integer AS total
      FROM (
        SELECT teacher_name, institution, course FROM materials
        UNION ALL
        SELECT teacher_name, institution, course FROM ratings
      ) AS combined
      ${where}
    `, params)
    const total = countRes.rows[0]?.total ?? 0

    // Get paginated teachers
    const queryParams: any[] = [...params, limit, offset]

    const result = await db.query(`
      SELECT
        MAX(teacher_name) AS name,
        COALESCE(STRING_AGG(DISTINCT institution, ','), '') AS institutions,
        COALESCE(STRING_AGG(DISTINCT course, ','), '') AS courses,
        COALESCE(ROUND(AVG(score)::numeric, 1), 0.0) AS rating,
        SUM(CASE WHEN score IS NOT NULL THEN 1 ELSE 0 END)::integer AS rating_count
      FROM (
        SELECT teacher_name, institution, course, NULL::integer AS score FROM materials
        UNION ALL
        SELECT teacher_name, institution, course, score FROM ratings
      ) AS combined
      ${where}
      GROUP BY LOWER(teacher_name)
      ORDER BY rating_count DESC, name ASC
      LIMIT $${queryParams.length - 1} OFFSET $${queryParams.length}
    `, queryParams)

    res.status(200).json({ 
      teachers: result.rows,
      pagination: { page, limit, total }
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Could not fetch teachers list' })
  }
}
