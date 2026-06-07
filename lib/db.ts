import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto'
import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { Pool } from 'pg'
import { createClient } from '@supabase/supabase-js'

const uploadDir = path.join(process.cwd(), 'public', 'uploads')

export type SessionUser = {
  id: number
  name: string
  email: string
  institute: string
  is_verified: boolean
}

let pool: Pool | null = null
let initialized = false

export function getPool() {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL
    pool = new Pool({
      connectionString,
      ssl: connectionString?.includes('supabase') || connectionString?.includes('neon.tech')
        ? { rejectUnauthorized: false }
        : false,
    })
  }
  return pool
}

export async function initDb() {
  if (initialized) return pool
  const db = getPool()

  // Ensure tables exist
  await db.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL UNIQUE,
      institute VARCHAR(255) NOT NULL,
      password_hash TEXT NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS sessions (
      token VARCHAR(255) PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS materials (
      id SERIAL PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      institution VARCHAR(255) NOT NULL,
      course VARCHAR(255) NOT NULL,
      teacher_name VARCHAR(255) NOT NULL,
      file_name VARCHAR(255),
      file_url TEXT,
      file_type VARCHAR(100),
      file_size INTEGER,
      uploader_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS ratings (
      id SERIAL PRIMARY KEY,
      teacher_name VARCHAR(255) NOT NULL,
      institution VARCHAR(255) NOT NULL,
      course VARCHAR(255) NOT NULL,
      school_year VARCHAR(50),
      score INTEGER NOT NULL CHECK (score BETWEEN 1 AND 5),
      comment TEXT NOT NULL DEFAULT '',
      is_anonymous BOOLEAN NOT NULL DEFAULT TRUE,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS topics (
      id SERIAL PRIMARY KEY,
      type VARCHAR(50) NOT NULL DEFAULT 'material',
      title VARCHAR(255) NOT NULL,
      body TEXT NOT NULL DEFAULT '',
      course VARCHAR(255) NOT NULL,
      institution VARCHAR(255) NOT NULL,
      teacher_name VARCHAR(255) NOT NULL,
      school_year VARCHAR(50),
      material_id INTEGER REFERENCES materials(id) ON DELETE SET NULL,
      rating_id INTEGER REFERENCES ratings(id) ON DELETE SET NULL,
      author_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS comments (
      id SERIAL PRIMARY KEY,
      topic_id INTEGER NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
      author_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      body TEXT NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `)

  // Run dynamic migrations if any column is missing
  await db.query(`ALTER TABLE topics ADD COLUMN IF NOT EXISTS type VARCHAR(50) NOT NULL DEFAULT 'material'`)
  await db.query(`ALTER TABLE topics ADD COLUMN IF NOT EXISTS school_year VARCHAR(50)`)
  await db.query(`ALTER TABLE topics ADD COLUMN IF NOT EXISTS rating_id INTEGER REFERENCES ratings(id) ON DELETE SET NULL`)
  await db.query(`ALTER TABLE ratings ADD COLUMN IF NOT EXISTS school_year VARCHAR(50)`)
  await db.query(`ALTER TABLE ratings ADD COLUMN IF NOT EXISTS is_anonymous BOOLEAN NOT NULL DEFAULT TRUE`)
  await db.query(`ALTER TABLE sessions ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE`)
  await db.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS is_verified BOOLEAN NOT NULL DEFAULT FALSE`)
  await db.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS verification_token VARCHAR(255)`)
  await db.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token VARCHAR(255)`)
  await db.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token_expires TIMESTAMP WITH TIME ZONE`)

  // Automatically mark previously registered users as verified so they are not locked out
  await db.query(`UPDATE users SET is_verified = TRUE WHERE is_verified = FALSE AND verification_token IS NULL`)

  // Setup indexes for search optimization
  await db.query(`CREATE INDEX IF NOT EXISTS idx_materials_teacher_name ON materials (LOWER(teacher_name))`)
  await db.query(`CREATE INDEX IF NOT EXISTS idx_materials_institution ON materials (LOWER(institution))`)
  await db.query(`CREATE INDEX IF NOT EXISTS idx_ratings_teacher_name ON ratings (LOWER(teacher_name))`)
  await db.query(`CREATE INDEX IF NOT EXISTS idx_ratings_institution ON ratings (LOWER(institution))`)
  await db.query(`CREATE INDEX IF NOT EXISTS idx_topics_institution ON topics (LOWER(institution))`)
  await db.query(`CREATE INDEX IF NOT EXISTS idx_comments_topic_id ON comments (topic_id)`)

  // GIN indexes for Full-Text Search (FTS)
  await db.query(`CREATE INDEX IF NOT EXISTS idx_materials_fts ON materials USING gin (to_tsvector('english', coalesce(title, '') || ' ' || coalesce(course, '') || ' ' || coalesce(institution, '') || ' ' || coalesce(teacher_name, '')))`);
  await db.query(`CREATE INDEX IF NOT EXISTS idx_materials_teacher_fts ON materials USING gin (to_tsvector('english', coalesce(teacher_name, '') || ' ' || coalesce(institution, '') || ' ' || coalesce(course, '')))`);
  await db.query(`CREATE INDEX IF NOT EXISTS idx_ratings_teacher_fts ON ratings USING gin (to_tsvector('english', coalesce(teacher_name, '') || ' ' || coalesce(institution, '') || ' ' || coalesce(course, '')))`);
  await db.query(`CREATE INDEX IF NOT EXISTS idx_topics_fts ON topics USING gin (to_tsvector('english', coalesce(title, '') || ' ' || coalesce(body, '') || ' ' || coalesce(course, '') || ' ' || coalesce(institution, '') || ' ' || coalesce(teacher_name, '')))`);

  initialized = true
  return db
}

// Backward compatibility helper
export async function getDb() {
  await initDb()
  return getPool()
}

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString('hex')
  const hash = scryptSync(password, salt, 64).toString('hex')
  return `${salt}:${hash}`
}

export function verifyPassword(password: string, storedHash: string) {
  const [salt, hash] = storedHash.split(':')
  if (!salt || !hash) return false

  const expected = Buffer.from(hash, 'hex')
  const actual = scryptSync(password, salt, 64)
  return expected.length === actual.length && timingSafeEqual(expected, actual)
}

export async function createSession(userId: number) {
  const token = randomBytes(32).toString('hex')
  const db = await getDb()
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
  await db.query('INSERT INTO sessions (token, user_id, expires_at) VALUES ($1, $2, $3)', [token, userId, expiresAt])
  return token
}

export async function getUserFromToken(token?: string): Promise<SessionUser | null> {
  if (!token) return null

  const db = await getDb()
  const res = await db.query<SessionUser>(`
    SELECT users.id, users.name, users.email, users.institute, users.is_verified
    FROM sessions
    JOIN users ON users.id = sessions.user_id
    WHERE sessions.token = $1 AND (sessions.expires_at IS NULL OR sessions.expires_at > CURRENT_TIMESTAMP)
  `, [token])

  return res.rows[0] ?? null
}

export async function getBearerUser(req: { headers: { authorization?: string }; cookies?: Partial<{ [key: string]: string }> }) {
  let token = req.cookies?.token
  if (!token && req.headers.authorization) {
    token = req.headers.authorization.replace(/^Bearer\s+/i, '')
  }
  return getUserFromToken(token)
}

export async function requireUser(req: { headers: { authorization?: string }; cookies?: Partial<{ [key: string]: string }> }) {
  const user = await getBearerUser(req)
  if (!user) {
    const error = new Error('Unauthorized')
    error.name = 'Unauthorized'
    throw error
  }
  return user
}

export async function saveUpload(file: { name: string; type: string; dataUrl: string }) {
  const match = file.dataUrl.match(/^data:(.+);base64,(.+)$/)
  if (!match) throw new Error('Invalid file payload')

  const bytes = Buffer.from(match[2], 'base64')

  // Validation: Max file size (25 MB)
  if (bytes.length > 25 * 1024 * 1024) {
    throw new Error('File size exceeds the 25 MB limit')
  }

  // Validation: File extension blocklist
  const ext = path.extname(file.name).toLowerCase()
  const blocklist = ['.exe', '.dll', '.bat', '.cmd', '.sh', '.php', '.js', '.vbs', '.scr', '.msi']
  if (blocklist.includes(ext)) {
    throw new Error('Unsupported or potentially unsafe file type')
  }

  const safeExt = path.extname(file.name).replace(/[^a-z0-9.]/gi, '').slice(0, 12)
  const safeBase = path.basename(file.name, path.extname(file.name)).replace(/[^a-z0-9-_]/gi, '-').slice(0, 48)
  const storedName = `${Date.now()}-${randomBytes(6).toString('hex')}-${safeBase}${safeExt}`

  const supabaseUrl = process.env.SUPABASE_URL
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY
  const bucketName = process.env.SUPABASE_BUCKET_NAME || 'materials'

  const isProd = process.env.NODE_ENV === 'production'

  if (supabaseUrl && supabaseAnonKey) {
    try {
      const supabase = createClient(supabaseUrl, supabaseAnonKey)
      const { data, error } = await supabase.storage
        .from(bucketName)
        .upload(storedName, bytes, {
          contentType: file.type,
          duplex: 'half'
        })

      if (error) {
        console.error('Supabase upload error:', error)
        if (isProd) {
          throw new Error(`File upload failed in production: ${error.message}`)
        }
      } else {
        const { data: urlData } = supabase.storage
          .from(bucketName)
          .getPublicUrl(storedName)

        return {
          fileName: file.name,
          fileUrl: urlData.publicUrl,
          fileType: file.type,
          fileSize: bytes.length,
        }
      }
    } catch (err: any) {
      console.error('Supabase upload catch error:', err)
      if (isProd) {
        throw new Error(err.message || 'File upload failed to reach Supabase storage')
      }
    }
  } else if (isProd) {
    throw new Error('Supabase storage environment variables (SUPABASE_URL and SUPABASE_ANON_KEY) are not configured in production. Enforced to prevent ephemeral local file loss.')
  }

  // Fallback to local (only allowed in development)
  if (!existsSync(uploadDir)) mkdirSync(uploadDir, { recursive: true })
  writeFileSync(path.join(uploadDir, storedName), bytes)

  return {
    fileName: file.name,
    fileUrl: `/uploads/${storedName}`,
    fileType: file.type,
    fileSize: bytes.length,
  }
}

export function toPublicUser(user: SessionUser, token: string) {
  return { token, user }
}

export async function deleteUpload(fileUrl: string) {
  if (!fileUrl) return

  if (fileUrl.startsWith('/uploads/')) {
    const fileName = fileUrl.replace(/^\/uploads\//, '')
    const filePath = path.join(uploadDir, fileName)
    try {
      const { unlinkSync } = await import('node:fs')
      const { existsSync } = await import('node:fs')
      if (existsSync(filePath)) {
        unlinkSync(filePath)
      }
    } catch (err) {
      console.error('Failed to delete local file:', err)
    }
  } else {
    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseAnonKey = process.env.SUPABASE_ANON_KEY
    const bucketName = process.env.SUPABASE_BUCKET_NAME || 'materials'

    if (supabaseUrl && supabaseAnonKey) {
      try {
        const prefix = `${supabaseUrl}/storage/v1/object/public/${bucketName}/`
        if (fileUrl.startsWith(prefix)) {
          const storedName = fileUrl.replace(prefix, '')
          const supabase = createClient(supabaseUrl, supabaseAnonKey)
          const { error } = await supabase.storage
            .from(bucketName)
            .remove([storedName])
          if (error) {
            console.error('Supabase delete error:', error)
          }
        }
      } catch (err) {
        console.error('Supabase delete catch error:', err)
      }
    }
  }
}
