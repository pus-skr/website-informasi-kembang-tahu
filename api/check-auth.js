import { getSession } from '../lib/auth.js';

export default function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'GET') return res.status(405).json({ authenticated: false });
  const session = getSession(req);
  return res.status(200).json({ authenticated: Boolean(session), username: session?.u || null });
}
