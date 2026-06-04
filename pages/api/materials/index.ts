import type { NextApiRequest, NextApiResponse } from 'next'
import { getDb, requireUser, saveUpload } from '../../../lib/db'

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '40mb',
    },
  },
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    const materials = getDb()
      .prepare(`
        SELECT materials.*, users.name AS uploader_name,
          topics.id AS topic_id,
          COALESCE(ROUND(AVG(ratings.score), 1), 0) AS teacher_rating,
          COUNT(ratings.id) AS rating_count
        FROM materials
        JOIN users ON users.id = materials.uploader_id
        LEFT JOIN topics ON topics.material_id = materials.id
        LEFT JOIN ratings ON LOWER(ratings.teacher_name) = LOWER(materials.teacher_name)
        GROUP BY materials.id
        ORDER BY materials.created_at DESC
      `)
      .all()

    return res.status(200).json({ materials })
  }

  if (req.method === 'POST') {
    try {
      const user = requireUser(req)
      const { title, institution, course, teacher, body, file } = req.body ?? {}
      if (!title || !institution || !course) {
        return res.status(400).json({ error: 'Title, school, and course are required' })
      }

      const upload = file?.dataUrl ? saveUpload(file) : { fileName: null, fileUrl: null, fileType: null, fileSize: null }
      const db = getDb()
      const materialResult = db
        .prepare(`
          INSERT INTO materials (title, institution, course, teacher_name, file_name, file_url, file_type, file_size, uploader_id)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `)
        .run(
          String(title).trim(),
          String(institution).trim(),
          String(course).trim(),
          String(teacher || 'Not specified').trim(),
          upload.fileName,
          upload.fileUrl,
          upload.fileType,
          upload.fileSize,
          user.id,
        )

      const materialId = Number(materialResult.lastInsertRowid)
      const topicResult = db
        .prepare(`
          INSERT INTO topics (type, title, body, course, institution, teacher_name, material_id, author_id)
          VALUES ('material', ?, ?, ?, ?, ?, ?, ?)
        `)
        .run(
          String(title).trim(),
          String(body ?? '').trim(),
          String(course).trim(),
          String(institution).trim(),
          String(teacher || 'Not specified').trim(),
          materialId,
          user.id,
        )

      const material = db.prepare('SELECT * FROM materials WHERE id = ?').get(materialId)
      res.status(201).json({ material, topicId: Number(topicResult.lastInsertRowid) })
    } catch (error: any) {
      if (error?.name === 'Unauthorized') return res.status(401).json({ error: 'Unauthorized' })
      res.status(500).json({ error: 'Could not upload material' })
    }
    return
  }

  res.status(405).json({ error: 'Method not allowed' })
}
