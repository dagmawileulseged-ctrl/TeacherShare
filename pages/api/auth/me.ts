import type { NextApiRequest, NextApiResponse } from 'next'
import { getBearerUser } from '../../../lib/db'

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  const user = getBearerUser(req)
  if (!user) return res.status(401).json({ error: 'Unauthorized' })

  res.status(200).json({ user })
}
