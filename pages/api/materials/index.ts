import type { NextApiRequest, NextApiResponse } from 'next'
import { getDb, requireUser, saveUpload } from '../../../lib/db'

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '40mb',
    },
  },
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const db = await getDb()

  if (req.method === 'GET') {
    try {
      const search = String(req.query.search ?? '').trim()
      const limit = Math.min(Math.max(parseInt(String(req.query.limit ?? '10')), 1), 50)
      const page = Math.max(parseInt(String(req.query.page ?? '1')), 1)
      const offset = (page - 1) * limit

      let where = ''
      let params: any[] = []
      if (search) {
        const searchTerms = search.split(/\s+/).filter(Boolean)
        const tsQuery = searchTerms.map(t => `${t.replace(/['":*&|!]/g, '')}:*`).join(' & ')
        if (tsQuery) {
          where = `WHERE to_tsvector('english', coalesce(materials.title, '') || ' ' || coalesce(materials.course, '') || ' ' || coalesce(materials.institution, '') || ' ' || coalesce(materials.teacher_name, '')) @@ to_tsquery('english', $1)`
          params = [tsQuery]
        }
      }

      // Get total count
      const countRes = await db.query(`
        SELECT COUNT(*)::integer AS total FROM materials
        ${where}
      `, params)
      const total = countRes.rows[0]?.total ?? 0

      // Get paginated materials
      const queryParams: any[] = [...params, limit, offset]

      const result = await db.query(`
        SELECT 
          materials.id, materials.title, materials.institution, materials.course, materials.teacher_name, 
          materials.file_name, materials.file_url, materials.file_type, materials.file_size, materials.uploader_id, materials.created_at,
          users.name AS uploader_name,
          MAX(topics.id) AS topic_id,
          COALESCE(ROUND(AVG(ratings.score)::numeric, 1), 0.0) AS teacher_rating,
          COUNT(DISTINCT ratings.id)::integer AS rating_count
        FROM materials
        JOIN users ON users.id = materials.uploader_id
        LEFT JOIN topics ON topics.material_id = materials.id
        LEFT JOIN ratings ON LOWER(ratings.teacher_name) = LOWER(materials.teacher_name)
        ${where}
        GROUP BY materials.id, users.id
        ORDER BY materials.created_at DESC
        LIMIT $${queryParams.length - 1} OFFSET $${queryParams.length}
      `, queryParams)

      return res.status(200).json({ 
        materials: result.rows,
        pagination: { page, limit, total }
      })
    } catch (error) {
      console.error(error)
      return res.status(500).json({ error: 'Could not fetch materials' })
    }
  }

  if (req.method === 'POST') {
    try {
      const user = await requireUser(req)
      const { title, institution, course, teacher, body, file } = req.body ?? {}
      if (!title || !institution || !course) {
        return res.status(400).json({ error: 'Title, school, and course are required' })
      }

      const upload = file?.dataUrl 
        ? await saveUpload(file) 
        : { fileName: null, fileUrl: null, fileType: null, fileSize: null }

      const materialResult = await db.query(`
        INSERT INTO materials (title, institution, course, teacher_name, file_name, file_url, file_type, file_size, uploader_id)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING id, title, institution, course, teacher_name, file_name, file_url, file_type, file_size, uploader_id, created_at
      `, [
        String(title).trim(),
        String(institution).trim(),
        String(course).trim(),
        String(teacher || 'Not specified').trim(),
        upload.fileName,
        upload.fileUrl,
        upload.fileType,
        upload.fileSize,
        user.id,
      ])

      const material = materialResult.rows[0]
      const materialId = material.id

      const topicResult = await db.query(`
        INSERT INTO topics (type, title, body, course, institution, teacher_name, material_id, author_id)
        VALUES ('material', $1, $2, $3, $4, $5, $6, $7)
        RETURNING id
      `, [
        String(title).trim(),
        String(body ?? '').trim(),
        String(course).trim(),
        String(institution).trim(),
        String(teacher || 'Not specified').trim(),
        materialId,
        user.id,
      ])

      res.status(201).json({ material, topicId: topicResult.rows[0].id })
    } catch (error: any) {
      if (error?.name === 'Unauthorized') return res.status(401).json({ error: 'Unauthorized' })
      console.error(error)
      res.status(500).json({ error: 'Could not upload material' })
    }
    return
  }

  res.status(405).json({ error: 'Method not allowed' })
}
