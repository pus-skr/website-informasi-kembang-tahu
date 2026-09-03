import { requireAuth } from '../lib/auth.js';
import { safeImageName, upsertFile } from '../lib/github.js';

const MAX_BYTES = 3 * 1024 * 1024;
const ALLOWED = new Set(['image/jpeg', 'image/png', 'image/gif', 'image/webp']);

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).json({ success: false, message: 'Metode request tidak valid.' });
  if (!requireAuth(req, res)) return;

  try {
    const { filename, mimeType, contentBase64 } = req.body || {};
    if (!filename || !mimeType || !contentBase64) {
      return res.status(400).json({ success: false, message: 'Data gambar tidak lengkap.' });
    }
    if (!ALLOWED.has(mimeType)) {
      return res.status(400).json({ success: false, message: 'Format gambar yang diizinkan: JPG, JPEG, PNG, WEBP, GIF.' });
    }

    const buffer = Buffer.from(contentBase64, 'base64');
    if (!buffer.length || buffer.length > MAX_BYTES) {
      return res.status(413).json({ success: false, message: 'Ukuran gambar maksimal 3 MB.' });
    }

    const safeName = safeImageName(filename);
    if (!safeName) return res.status(400).json({ success: false, message: 'Nama atau format file tidak valid.' });

    const path = `assets/images/galeri/${safeName}`;
    await upsertFile(path, buffer, `Tambah foto galeri ${safeName}`);

    return res.status(200).json({ success: true, path: path });
  } catch (error) {
    console.error('upload error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Gagal mengunggah gambar.' });
  }
}
