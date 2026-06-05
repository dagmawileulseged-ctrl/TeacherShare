import type { NextApiRequest, NextApiResponse } from 'next'
import { getDb } from '../../../lib/db'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  try {
    const db = await getDb()
    const search = String(req.query.search ?? '').trim()
    const institution = String(req.query.institution ?? '').trim()
    const teacher = String(req.query.teacher ?? '').trim()
    const type = String(req.query.type ?? '').trim()
    const sort = String(req.query.sort ?? '').trim()

    const whereClauses: string[] = []
    const params: any[] = []

    if (search) {
      const searchTerms = search.split(/\s+/).filter(Boolean)
      const tsQuery = searchTerms.map(t => `${t.replace(/['":*&|!]/g, '')}:*`).join(' & ')
      if (tsQuery) {
        params.push(tsQuery)
        whereClauses.push(`to_tsvector('english', coalesce(topics.title, '') || ' ' || coalesce(topics.body, '') || ' ' || coalesce(topics.course, '') || ' ' || coalesce(topics.institution, '') || ' ' || coalesce(topics.teacher_name, '')) @@ to_tsquery('english', $${params.length})`)
      }
    }

    if (institution) {
      params.push(institution)
      whereClauses.push(`LOWER(topics.institution) = LOWER($${params.length})`)
    }

    if (teacher) {
      params.push(teacher)
      whereClauses.push(`LOWER(topics.teacher_name) = LOWER($${params.length})`)
    }

    if (type && (type === 'material' || type === 'rating')) {
      params.push(type)
      whereClauses.push(`topics.type = $${params.length}`)
    }

    const limit = Math.min(Math.max(parseInt(String(req.query.limit ?? '10')), 1), 50)
    const page = Math.max(parseInt(String(req.query.page ?? '1')), 1)
    const offset = (page - 1) * limit

    const where = whereClauses.length ? `WHERE ${whereClauses.join(' AND ')}` : ''

    // Get total count
    const countRes = await db.query(`
      SELECT COUNT(*)::integer AS total
      FROM topics
      LEFT JOIN ratings ON ratings.id = topics.rating_id
      ${where}
    `, params)
    const total = countRes.rows[0]?.total ?? 0

    // Get paginated results
    const queryParams = [...params]
    queryParams.push(limit)
    queryParams.push(offset)

    let orderBy = 'ORDER BY topics.created_at DESC'
    if (sort === 'rating') {
      orderBy = 'ORDER BY COALESCE(ratings.score, 0) DESC, topics.created_at DESC'
    }

    const result = await db.query(`
      SELECT 
        topics.id, topics.type, topics.title, topics.body, topics.course, topics.institution, topics.teacher_name, topics.school_year, topics.material_id, topics.rating_id, topics.created_at,
        CASE 
          WHEN topics.type = 'rating' AND ratings.is_anonymous = TRUE THEN 'Anonymous Student'
          ELSE users.name 
        END AS author_name,
        materials.file_name, materials.file_url, materials.file_type, materials.file_size,
        ratings.score, ratings.comment
      FROM topics
      JOIN users ON users.id = topics.author_id
      LEFT JOIN materials ON materials.id = topics.material_id
      LEFT JOIN ratings ON ratings.id = topics.rating_id
      ${where}
      ${orderBy}
      LIMIT $${queryParams.length - 1} OFFSET $${queryParams.length}
    `, queryParams)

    res.status(200).json({ 
      topics: result.rows,
      pagination: { page, limit, total }
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Could not fetch topics' })
  }
}
