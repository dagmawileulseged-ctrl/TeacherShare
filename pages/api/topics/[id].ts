import type { NextApiRequest, NextApiResponse } from 'next'
import { getDb, requireUser } from '../../../lib/db'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const topicId = Number(req.query.id)
  if (isNaN(topicId)) return res.status(400).json({ error: 'Invalid topic ID' })

  const db = await getDb()

  if (req.method === 'GET') {
    try {
      const topicResult = await db.query(`
        SELECT 
          topics.id, topics.type, topics.title, topics.body, topics.course, topics.institution, topics.teacher_name, topics.school_year, topics.material_id, topics.rating_id, topics.created_at, topics.author_id,
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
        WHERE topics.id = $1
      `, [topicId])

      const topic = topicResult.rows[0]
      if (!topic) return res.status(404).json({ error: 'Topic not found' })

      const commentsResult = await db.query(`
        SELECT 
          comments.id, comments.topic_id, comments.body, comments.created_at, comments.author_id,
          users.name AS author_name
        FROM comments
        JOIN users ON users.id = comments.author_id
        WHERE comments.topic_id = $1
        ORDER BY comments.created_at ASC
      `, [topicId])

      res.status(200).json({ topic, comments: commentsResult.rows })
    } catch (error) {
      console.error(error)
      res.status(500).json({ error: 'Could not fetch topic details' })
    }
    return
  }

  if (req.method === 'POST') {
    try {
      const user = await requireUser(req)
      const { body } = req.body ?? {}
      if (!body || !String(body).trim()) {
        return res.status(400).json({ error: 'Comment body is required' })
      }

      const commentResult = await db.query(`
        INSERT INTO comments (topic_id, author_id, body)
        VALUES ($1, $2, $3)
        RETURNING id, topic_id, author_id, body, created_at
      `, [topicId, user.id, String(body).trim()])

      const comment = commentResult.rows[0]

      res.status(201).json({
        comment: {
          ...comment,
          author_name: user.name
        }
      })
    } catch (error: any) {
      if (error?.name === 'Unauthorized') return res.status(401).json({ error: 'Unauthorized' })
      console.error(error)
      res.status(500).json({ error: 'Could not create comment' })
    }
    return
  }

  if (req.method === 'PUT') {
    try {
      const user = await requireUser(req)
      const { title, body, course, institution, teacher_name, school_year, score } = req.body ?? {}

      if (!title || !course || !institution) {
        return res.status(400).json({ error: 'Title, course, and institution are required' })
      }

      const topicResult = await db.query('SELECT * FROM topics WHERE id = $1', [topicId])
      const topic = topicResult.rows[0]
      if (!topic) return res.status(404).json({ error: 'Topic not found' })

      if (topic.author_id !== user.id) {
        return res.status(403).json({ error: 'You are not authorized to edit this topic' })
      }

      // Update topics table
      await db.query(`
        UPDATE topics
        SET title = $1, body = $2, course = $3, institution = $4, teacher_name = $5, school_year = $6
        WHERE id = $7
      `, [
        String(title).trim(),
        String(body ?? '').trim(),
        String(course).trim(),
        String(institution).trim(),
        String(teacher_name || 'Not specified').trim(),
        school_year ? String(school_year).trim() : null,
        topicId
      ])

      // If material, update materials table
      if (topic.type === 'material' && topic.material_id) {
        await db.query(`
          UPDATE materials
          SET title = $1, course = $2, institution = $3, teacher_name = $4
          WHERE id = $5
        `, [
          String(title).trim(),
          String(course).trim(),
          String(institution).trim(),
          String(teacher_name || 'Not specified').trim(),
          topic.material_id
        ])
      }

      // If rating, update ratings table
      if (topic.type === 'rating' && topic.rating_id) {
        const numericScore = Math.max(1, Math.min(5, Number(score || 5)))
        await db.query(`
          UPDATE ratings
          SET course = $1, institution = $2, teacher_name = $3, school_year = $4, score = $5, comment = $6
          WHERE id = $7
        `, [
          String(course).trim(),
          String(institution).trim(),
          String(teacher_name || 'Not specified').trim(),
          school_year ? String(school_year).trim() : null,
          numericScore,
          String(body ?? '').trim(),
          topic.rating_id
        ])
      }

      res.status(200).json({ message: 'Topic updated successfully' })
    } catch (error: any) {
      if (error?.name === 'Unauthorized') return res.status(401).json({ error: 'Unauthorized' })
      console.error(error)
      res.status(500).json({ error: 'Could not update topic' })
    }
    return
  }

  if (req.method === 'DELETE') {
    try {
      const user = await requireUser(req)

      const topicResult = await db.query('SELECT * FROM topics WHERE id = $1', [topicId])
      const topic = topicResult.rows[0]
      if (!topic) return res.status(404).json({ error: 'Topic not found' })

      if (topic.author_id !== user.id) {
        return res.status(403).json({ error: 'You are not authorized to delete this topic' })
      }

      // Delete from topics
      await db.query('DELETE FROM topics WHERE id = $1', [topicId])

      // Delete from materials if any
      if (topic.material_id) {
        await db.query('DELETE FROM materials WHERE id = $1', [topic.material_id])
      }

      // Delete from ratings if any
      if (topic.rating_id) {
        await db.query('DELETE FROM ratings WHERE id = $1', [topic.rating_id])
      }

      res.status(200).json({ message: 'Topic and associated contents deleted successfully' })
    } catch (error: any) {
      if (error?.name === 'Unauthorized') return res.status(401).json({ error: 'Unauthorized' })
      console.error(error)
      res.status(500).json({ error: 'Could not delete topic' })
    }
    return
  }

  res.status(405).json({ error: 'Method not allowed' })
}
