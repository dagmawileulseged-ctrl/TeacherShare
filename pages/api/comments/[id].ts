import type { NextApiRequest, NextApiResponse } from 'next'
import { getDb, requireUser } from '../../../lib/db'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const commentId = Number(req.query.id)
  if (isNaN(commentId)) return res.status(400).json({ error: 'Invalid comment ID' })

  const db = await getDb()

  if (req.method === 'PUT') {
    try {
      const user = await requireUser(req)
      const { body } = req.body ?? {}
      if (!body || !String(body).trim()) {
        return res.status(400).json({ error: 'Comment body is required' })
      }

      const commentResult = await db.query('SELECT * FROM comments WHERE id = $1', [commentId])
      const comment = commentResult.rows[0]
      if (!comment) return res.status(404).json({ error: 'Comment not found' })

      if (comment.author_id !== user.id) {
        return res.status(403).json({ error: 'You are not authorized to edit this comment' })
      }

      const updateResult = await db.query(`
        UPDATE comments
        SET body = $1
        WHERE id = $2
        RETURNING id, topic_id, author_id, body, created_at
      `, [String(body).trim(), commentId])

      res.status(200).json({ comment: updateResult.rows[0] })
    } catch (error: any) {
      if (error?.name === 'Unauthorized') return res.status(401).json({ error: 'Unauthorized' })
      console.error(error)
      res.status(500).json({ error: 'Could not edit comment' })
    }
    return
  }

  if (req.method === 'DELETE') {
    try {
      const user = await requireUser(req)

      const commentResult = await db.query('SELECT * FROM comments WHERE id = $1', [commentId])
      const comment = commentResult.rows[0]
      if (!comment) return res.status(404).json({ error: 'Comment not found' })

      if (comment.author_id !== user.id) {
        return res.status(403).json({ error: 'You are not authorized to delete this comment' })
      }

      await db.query('DELETE FROM comments WHERE id = $1', [commentId])

      res.status(200).json({ message: 'Comment deleted successfully' })
    } catch (error: any) {
      if (error?.name === 'Unauthorized') return res.status(401).json({ error: 'Unauthorized' })
      console.error(error)
      res.status(500).json({ error: 'Could not delete comment' })
    }
    return
  }

  res.status(405).json({ error: 'Method not allowed' })
}
