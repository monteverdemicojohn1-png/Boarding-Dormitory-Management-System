import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { pool, initDb } from './db.js';
import { verifyPassword, hashPassword, createSession, destroySession, requireAuth, extractToken } from './auth.js';
import { wrap, round2, balanceFor } from './helpers.js';
import tenantsRouter from './routes/tenants.js';
import roomsRouter from './routes/rooms.js';
import paymentsRouter from './routes/payments.js';
import reportsRouter from './routes/reports.js';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT || 5000);

app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173' }));
app.use(express.json({ limit: '1mb' }));

app.get('/api/health', (req, res) => res.json({ ok: true }));

app.post('/api/admin/login', wrap(async (req, res) => {
  const { username = '', password = '' } = req.body || {};
  const [rows] = await pool.query('SELECT * FROM admins WHERE username = ?', [username]);
  if (!rows.length || !verifyPassword(password, rows[0].password_hash)) {
    return res.status(401).json({ error: 'Invalid username or password.' });
  }
  res.json({ token: createSession(rows[0].id), name: rows[0].name });
}));

app.post('/api/admin/logout', requireAuth, (req, res) => {
  const token = extractToken(req);
  if (token) destroySession(token);
  res.json({ ok: true });
});

app.get('/api/dashboard', requireAuth, wrap(async (req, res) => {
  const [roomRows] = await pool.query('SELECT status, COUNT(*) AS count FROM rooms GROUP BY status');
  const [tenantRows] = await pool.query("SELECT COUNT(*) AS count FROM tenants WHERE status = 'active'");
  const [monthRows] = await pool.query("SELECT COALESCE(SUM(amount), 0) AS total FROM payments WHERE DATE_FORMAT(paid_at, '%Y-%m') = DATE_FORMAT(CURDATE(), '%Y-%m')");
  const [totalRows] = await pool.query('SELECT COALESCE(SUM(amount), 0) AS total FROM payments');
  const [recent] = await pool.query(`SELECT p.id, p.amount, p.method, p.gcash_reference, p.period_month, p.paid_at, p.notes,
    t.full_name, r.room_number FROM payments p JOIN tenants t ON t.id = p.tenant_id
    LEFT JOIN rooms r ON r.id = t.room_id ORDER BY p.paid_at DESC LIMIT 8`);
  const [actives] = await pool.query("SELECT t.*, r.monthly_rent FROM tenants t LEFT JOIN rooms r ON r.id = t.room_id WHERE t.status = 'active'");
  let outstanding = 0;
  for (const t of actives) outstanding += (await balanceFor(t)).balance;
  res.json({ rooms: roomRows, activeTenants: tenantRows[0].count, collectedThisMonth: round2(monthRows[0].total), totalCollected: round2(totalRows[0].total), outstanding: round2(outstanding), recentPayments: recent });
}));

app.use('/api/tenants', tenantsRouter);
app.use('/api/rooms', roomsRouter);
app.use('/api/payments', paymentsRouter);
app.use('/api/reports', reportsRouter);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Server error. Check the server console for details.' });
});

async function main() {
  await initDb();
  const username = process.env.ADMIN_USERNAME || 'admin';
  const password = process.env.ADMIN_PASSWORD || 'admin123';
  const [rows] = await pool.query('SELECT id FROM admins WHERE username = ?', [username]);
  if (!rows.length) {
    await pool.query('INSERT INTO admins (username, password_hash, name) VALUES (?, ?, ?)', [username, hashPassword(password), process.env.ADMIN_NAME || 'Dorm Administrator']);
    console.log(`Admin account "${username}" was created.`);
  }
  app.listen(PORT, () => console.log(`API running at http://localhost:${PORT}`));
}

main().catch(err => { console.error('Failed to start the server:', err.message); process.exit(1); });
