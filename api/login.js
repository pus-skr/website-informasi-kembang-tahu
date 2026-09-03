import crypto from 'node:crypto';
import { createSessionCookie, getClientIp } from '../lib/auth.js';

const attempts = new Map();
const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 10;

function isRateLimited(key) {
  const now = Date.now();
  const current = attempts.get(key) || { count: 0, start: now };
  if (now - current.start > WINDOW_MS) {
    attempts.set(key, { count: 1, start: now });
    return false;
  }
  current.count += 1;
  attempts.set(key, current);
  return current.count > MAX_ATTEMPTS;
}

function safeEqual(a, b) {
  const aa = Buffer.from(String(a));
  const bb = Buffer.from(String(b));
  return aa.length === bb.length && crypto.timingSafeEqual(aa, bb);
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).json({ success: false, message: 'Metode request tidak valid.' });

  try {
    const ip = getClientIp(req);
    if (isRateLimited(ip)) {
      return res.status(429).json({ success: false, message: 'Terlalu banyak percobaan. Coba lagi beberapa menit.' });
    }

    const { username = '', password = '', rememberMe = false } = req.body || {};
    const expectedUsername = process.env.ADMIN_USERNAME;
    const expectedPassword = process.env.ADMIN_PASSWORD;

    if (!expectedUsername || !expectedPassword || !process.env.SESSION_SECRET) {
      return res.status(500).json({ success: false, message: 'Konfigurasi login belum lengkap di Vercel.' });
    }

    if (!safeEqual(username, expectedUsername) || !safeEqual(password, expectedPassword)) {
      return res.status(401).json({ success: false, message: 'Username atau password salah.' });
    }

    res.setHeader('Set-Cookie', createSessionCookie(expectedUsername, Boolean(rememberMe)));
    return res.status(200).json({ success: true, message: 'Login berhasil.' });
  } catch (error) {
    console.error('login error:', error);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan sistem.' });
  }
}
