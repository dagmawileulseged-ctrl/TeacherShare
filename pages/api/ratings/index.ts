import type { NextApiRequest, NextApiResponse } from 'next'
import { getDb, requireUser } from '../../../lib/db'

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    const teacher = String(req.query.teacher ?? '').trim()
    const where = teacher ? 'WHERE LOWER(teacher_name) = LOWER(?)' : ''
    const params = teacher ? [teacher] : []
    const ratings = getDb()
      .prepare(`
        SELECT ratings.*, users.name AS user_name
        FROM ratings
        JOIN users ON users.id = ratings.user_id
        ${where}
        ORDER BY ratings.created_at DESC
      `)
      .all(...params)

    return res.status(200).json({ ratings })
  }

  if (req.method === 'POST') {
    try {
      const user = requireUser(req)
      const { teacher, institution, course, schoolYear, score, comment } = req.body ?? {}
      const numericScore = Number(score)
      if (!teacher || !institution || !course || !schoolYear || numericScore < 1 || numericScore > 5) {
        return res.status(400).json({ error: 'Teacher name, course name, year, school, and a 1-5 score are required' })
      }

      const result = getDb()
        .prepare(`
          INSERT INTO ratings (teacher_name, institution, course, school_year, score, comment, user_id)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `)
        .run(
          String(teacher).trim(),
          String(institution).trim(),
          String(course).trim(),
          String(schoolYear).trim(),
          numericScore,
          String(comment ?? '').trim(),
          user.id,
        )

      const ratingId = Number(result.lastInsertRowid)
      const topicResult = getDb()
        .prepare(`
          INSERT INTO topics (type, title, body, course, institution, teacher_name, school_year, rating_id, author_id)
          VALUES ('rating', ?, ?, ?, ?, ?, ?, ?, ?)
        `)
        .run(
          `Rating for ${String(teacher).trim()}`,
          String(comment ?? '').trim(),
          String(course).trim(),
          String(institution).trim(),
          String(teacher).trim(),
          String(schoolYear).trim(),
          ratingId,
          user.id,
        )

      const rating = getDb().prepare('SELECT * FROM ratings WHERE id = ?').get(ratingId)
      return res.status(201).json({ rating, topicId: Number(topicResult.lastInsertRowid) })
    } catch (error: any) {
      if (error?.name === 'Unauthorized') return res.status(401).json({ error: 'Unauthorized' })
      return res.status(500).json({ error: 'Could not save rating' })
    }
  }

  res.status(405).json({ error: 'Method not allowed' })
}
