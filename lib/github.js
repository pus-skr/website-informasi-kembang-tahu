const API_BASE = 'https://api.github.com';

function config() {
  const token = process.env.GITHUB_TOKEN;
  const owner = process.env.GITHUB_OWNER;
  const repo = process.env.GITHUB_REPO;
  const branch = process.env.GITHUB_BRANCH || 'main';

  if (!token || !owner || !repo) {
    throw new Error('GITHUB_TOKEN, GITHUB_OWNER, dan GITHUB_REPO wajib diatur di Vercel.');
  }
  return { token, owner, repo, branch };
}

async function githubRequest(path, options = {}) {
  const { token } = config();
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${token}`,
      'X-GitHub-Api-Version': '2022-11-28',
      ...(options.headers || {})
    }
  });

  const text = await response.text();
  let data;
  try { data = text ? JSON.parse(text) : {}; } catch { data = { message: text }; }

  if (!response.ok) {
    const error = new Error(data.message || `GitHub API error (${response.status})`);
    error.status = response.status;
    throw error;
  }
  return data;
}

export async function getFile(path) {
  const { owner, repo, branch } = config();
  return githubRequest(`/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/contents/${path}?ref=${encodeURIComponent(branch)}`);
}

export async function upsertFile(path, contentBuffer, message) {
  const { owner, repo, branch } = config();
  let sha;
  try {
    const existing = await getFile(path);
    sha = existing.sha;
  } catch (error) {
    if (error.status !== 404) throw error;
  }

  const body = {
    message,
    content: contentBuffer.toString('base64'),
    branch
  };
  if (sha) body.sha = sha;

  return githubRequest(`/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/contents/${path}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
}

export function safeDataType(type) {
  const allowed = new Set(['umkm', 'sejarah', 'proses', 'galeri', 'lokasi', 'kontak', 'site']);
  return allowed.has(type) ? type : null;
}

export function safeImageName(name = '') {
  const original = name.split(/[\\/]/).pop() || 'gambar.webp';
  const ext = original.toLowerCase().match(/\.(jpg|jpeg|png|gif|webp)$/)?.[1];
  if (!ext) return null;
  const base = original
    .replace(/\.[^.]+$/, '')
    .normalize('NFKD')
    .replace(/[^a-zA-Z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'gambar';
  return `${Date.now()}-${base}.${ext}`;
}
