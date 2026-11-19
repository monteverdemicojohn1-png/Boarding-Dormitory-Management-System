import crypto from 'node:crypto';

const sessions = new Map();

export function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return salt + ':' + hash;
}

export function verifyPassword(password, stored) {
  const [salt, hash] = String(stored).split(':');
  if (!salt || !hash) return false;
  const candidate = crypto.scryptSync(password, salt, 64).toString('hex');
  return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(candidate, 'hex'));
}

export function createSession(adminId) {
  const token = crypto.randomBytes(32).toString('hex');
  sessions.set(token, { adminId, expiresAt: Date.now() + 8 * 60 * 60 * 1000 });
  return token;
}

export function getSession(token) {
  const s = sessions.get(token);
  if (!s) return null;
  if (Date.now() > s.expiresAt) { sessions.delete(token); return null; }
  return s;
}

export function destroySession(token) { sessions.delete(token); }
export function extractToken(req) {
  const header = req.headers.authorization || '';
  return header.startsWith('Bearer ') ? header.slice(7) : null;
}

export function requireAuth(req, res, next) {
  const session = getSession(extractToken(req));
  if (!session) return res.status(401).json({ error: 'Unauthorized. Please log in again.' });
  req.adminId = session.adminId;
  next();
}
