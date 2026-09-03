import { requireAuth } from '../lib/auth.js';
import { safeDataType, upsertFile } from '../lib/github.js';

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).json({ success: false, message: 'Metode request tidak valid.' });
  if (!requireAuth(req, res)) return;

  try {
    const { type, payload } = req.body || {};
    const safeType = safeDataType(type);
    if (!safeType || payload === undefined || payload === null) {
      return res.status(400).json({ success: false, message: 'Tipe data atau payload tidak valid.' });
    }

    const content = JSON.stringify(payload, null, 2) + '\n';
    await upsertFile(
      `data/${safeType}.json`,
      Buffer.from(content, 'utf8'),
      `Update data ${safeType} dari panel pengelola`
    );

    return res.status(200).json({ success: true, message: 'Data berhasil dikirim ke GitHub. Website akan diperbarui otomatis oleh Vercel.' });
  } catch (error) {
    console.error('save error:', error);
    return res.status(error.status === 404 ? 404 : 500).json({ success: false, message: error.message || 'Gagal menyimpan data.' });
  }
}
