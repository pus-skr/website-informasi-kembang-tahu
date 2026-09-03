import { clearSessionCookie } from '../lib/auth.js';

export default function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Set-Cookie', clearSessionCookie());
  return res.status(200).json({ success: true, message: 'Logout berhasil.' });
}
