import type { NextApiRequest, NextApiResponse } from 'next'
import { getDb, requireUser } from '../../../lib/db'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const db = await getDb()

  if (req.method === 'GET') {
    try {
      const teacher = String(req.query.teacher ?? '').trim()
      const limit = Math.min(Math.max(parseInt(String(req.query.limit ?? '10')), 1), 50)
      const page = Math.max(parseInt(String(req.query.page ?? '1')), 1)
      const offset = (page - 1) * limit

      const where = teacher ? 'WHERE LOWER(ratings.teacher_name) = LOWER($1)' : ''
      const params = teacher ? [teacher] : []

      // Get total count
      const countRes = await db.query(`
        SELECT COUNT(*)::integer AS total FROM ratings
        ${where}
      `, params)
      const total = countRes.rows[0]?.total ?? 0

      // Get paginated ratings
      const queryParams: any[] = [...params, limit, offset]

      const result = await db.query(`
        SELECT 
          ratings.id, ratings.teacher_name, ratings.institution, ratings.course, ratings.school_year, ratings.score, ratings.comment, ratings.is_anonymous, ratings.created_at,
          CASE WHEN ratings.is_anonymous = TRUE THEN 'Anonymous Student' ELSE users.name END AS user_name
        FROM ratings
        LEFT JOIN users ON users.id = ratings.user_id
        ${where}
        ORDER BY ratings.created_at DESC
        LIMIT $${queryParams.length - 1} OFFSET $${queryParams.length}
      `, queryParams)

      return res.status(200).json({ 
        ratings: result.rows,
        pagination: { page, limit, total }
      })
    } catch (error) {
      console.error(error)
      return res.status(500).json({ error: 'Could not fetch ratings' })
    }
  }

  if (req.method === 'POST') {
    try {
      const user = await requireUser(req)
      const { teacher, institution, course, schoolYear, score, comment, isAnonymous } = req.body ?? {}
      const numericScore = Number(score)
      if (!teacher || !institution || !course || !schoolYear || numericScore < 1 || numericScore > 5) {
        return res.status(400).json({ error: 'Teacher name, course name, year, school, and a 1-5 score are required' })
      }

      const isAnon = isAnonymous !== false

      // Insert rating
      const ratingResult = await db.query(`
        INSERT INTO ratings (teacher_name, institution, course, school_year, score, comment, is_anonymous, user_id)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING id, teacher_name, institution, course, school_year, score, comment, is_anonymous, created_at
      `, [
        String(teacher).trim(),
        String(institution).trim(),
        String(course).trim(),
        String(schoolYear).trim(),
        numericScore,
        String(comment ?? '').trim(),
        isAnon,
        user.id,
      ])

      const rating = ratingResult.rows[0]
      const ratingId = rating.id

      // Insert topic
      const topicResult = await db.query(`
        INSERT INTO topics (type, title, body, course, institution, teacher_name, school_year, rating_id, author_id)
        VALUES ('rating', $1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING id
      `, [
        `Rating for ${String(teacher).trim()}`,
        String(comment ?? '').trim(),
        String(course).trim(),
        String(institution).trim(),
        String(teacher).trim(),
        String(schoolYear).trim(),
        ratingId,
        user.id,
      ])

      return res.status(201).json({ 
        rating: {
          ...rating,
          user_name: isAnon ? 'Anonymous Student' : user.name
        }, 
        topicId: topicResult.rows[0].id 
      })
    } catch (error: any) {
      if (error?.name === 'Unauthorized') return res.status(401).json({ error: 'Unauthorized' })
      console.error(error)
      return res.status(500).json({ error: 'Could not save rating' })
    }
  }

  res.status(405).json({ error: 'Method not allowed' })
}
