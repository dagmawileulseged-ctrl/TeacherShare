import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto'
import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { DatabaseSync } from 'node:sqlite'

const dataDir = path.join(process.cwd(), 'data')
const uploadDir = path.join(process.cwd(), 'public', 'uploads')
const dbPath = path.join(dataDir, 'app.sqlite')

let db: DatabaseSync | null = null

export type SessionUser = {
  id: number
  name: string
  email: string
  institute: string
}

export function getDb() {
  if (!existsSync(dataDir)) mkdirSync(dataDir, { recursive: true })
  if (!existsSync(uploadDir)) mkdirSync(uploadDir, { recursive: true })

  if (!db) {
    db = new DatabaseSync(dbPath)
    db.exec(`
      PRAGMA journal_mode = WAL;
      PRAGMA foreign_keys = ON;

      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        institute TEXT NOT NULL,
        password_hash TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS sessions (
        token TEXT PRIMARY KEY,
        user_id INTEGER NOT NULL,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS materials (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        institution TEXT NOT NULL,
        course TEXT NOT NULL,
        teacher_name TEXT NOT NULL,
        file_name TEXT,
        file_url TEXT,
        file_type TEXT,
        file_size INTEGER,
        uploader_id INTEGER NOT NULL,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (uploader_id) REFERENCES users(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS topics (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        type TEXT NOT NULL DEFAULT 'material',
        title TEXT NOT NULL,
        body TEXT NOT NULL DEFAULT '',
        course TEXT NOT NULL,
        institution TEXT NOT NULL,
        teacher_name TEXT NOT NULL,
        school_year TEXT,
        material_id INTEGER,
        rating_id INTEGER,
        author_id INTEGER NOT NULL,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (material_id) REFERENCES materials(id) ON DELETE SET NULL,
        FOREIGN KEY (rating_id) REFERENCES ratings(id) ON DELETE SET NULL,
        FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS ratings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        teacher_name TEXT NOT NULL,
        institution TEXT NOT NULL,
        course TEXT NOT NULL,
        school_year TEXT,
        score INTEGER NOT NULL CHECK(score BETWEEN 1 AND 5),
        comment TEXT NOT NULL DEFAULT '',
        user_id INTEGER NOT NULL,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );
    `)

    migrateColumn(db, 'topics', 'type', "TEXT NOT NULL DEFAULT 'material'")
    migrateColumn(db, 'topics', 'school_year', 'TEXT')
    migrateColumn(db, 'topics', 'rating_id', 'INTEGER')
    migrateColumn(db, 'ratings', 'school_year', 'TEXT')
  }

  return db
}

function migrateColumn(database: DatabaseSync, table: string, column: string, definition: string) {
  const columns = database.prepare(`PRAGMA table_info(${table})`).all()
  if (!columns.some((item) => item.name === column)) {
    database.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`)
  }
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

export function createSession(userId: number) {
  const token = randomBytes(32).toString('hex')
  getDb().prepare('INSERT INTO sessions (token, user_id) VALUES (?, ?)').run(token, userId)
  return token
}

export function getUserFromToken(token?: string): SessionUser | null {
  if (!token) return null

  const user = getDb()
    .prepare(`
      SELECT users.id, users.name, users.email, users.institute
      FROM sessions
      JOIN users ON users.id = sessions.user_id
      WHERE sessions.token = ?
    `)
    .get(token) as SessionUser | undefined

  return user ?? null
}

export function getBearerUser(req: { headers: { authorization?: string } }) {
  const token = req.headers.authorization?.replace(/^Bearer\s+/i, '')
  return getUserFromToken(token)
}

export function requireUser(req: { headers: { authorization?: string } }) {
  const user = getBearerUser(req)
  if (!user) {
    const error = new Error('Unauthorized')
    error.name = 'Unauthorized'
    throw error
  }
  return user
}

export function saveUpload(file: { name: string; type: string; dataUrl: string }) {
  const match = file.dataUrl.match(/^data:(.+);base64,(.+)$/)
  if (!match) throw new Error('Invalid file payload')

  const ext = path.extname(file.name).replace(/[^a-z0-9.]/gi, '').slice(0, 12)
  const safeBase = path.basename(file.name, path.extname(file.name)).replace(/[^a-z0-9-_]/gi, '-').slice(0, 48)
  const storedName = `${Date.now()}-${randomBytes(6).toString('hex')}-${safeBase}${ext}`
  const bytes = Buffer.from(match[2], 'base64')

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
