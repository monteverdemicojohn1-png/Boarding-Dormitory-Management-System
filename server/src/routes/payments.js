import { Router } from 'express';
import { pool } from '../db.js';
import { requireAuth } from '../auth.js';
import { wrap, round2, balanceFor } from '../helpers.js';

const router = Router();
router.use(requireAuth);

router.get('/', wrap(async (req, res) => {
  const { tenant_id = '', method = '', month = '' } = req.query;
  let sql = `SELECT p.*, t.full_name, r.room_number FROM payments p
             JOIN tenants t ON t.id = p.tenant_id LEFT JOIN rooms r ON r.id = t.room_id WHERE 1=1`;
  const params = [];
  if (tenant_id) { sql += ' AND p.tenant_id = ?'; params.push(tenant_id); }
  if (method) { sql += ' AND p.method = ?'; params.push(method); }
  if (month) { sql += ' AND p.period_month = ?'; params.push(month); }
  sql += ' ORDER BY p.paid_at DESC LIMIT 200';
  const [rows] = await pool.query(sql, params);
  res.json(rows);
}));

router.post('/', wrap(async (req, res) => {
  const { tenant_id, amount, method, gcash_reference = '', period_month = '', notes = '' } = req.body || {};
  const amt = Number(amount);
  if (!tenant_id || !amt || amt <= 0) return res.status(400).json({ error: 'Tenant and a valid amount are required.' });
  if (!['cash', 'gcash'].includes(method)) return res.status(400).json({ error: 'Payment method must be cash or gcash.' });
  if (!/^\d{4}-\d{2}$/.test(period_month)) return res.status(400).json({ error: 'Billing period must be in YYYY-MM format.' });
  if (method === 'gcash' && !String(gcash_reference).trim()) return res.status(400).json({ error: 'A GCash reference number is required for GCash payments.' });
  const [tenants] = await pool.query("SELECT * FROM tenants WHERE id = ? AND status = 'active'", [tenant_id]);
  if (!tenants.length) return res.status(400).json({ error: 'Tenant not found or already moved out.' });
  const [result] = await pool.query(`INSERT INTO payments (tenant_id, amount, method, gcash_reference, period_month, notes)
    VALUES (?, ?, ?, ?, ?, ?)`, [tenant_id, round2(amt), method, method === 'gcash' ? String(gcash_reference).trim() : null, period_month, notes]);
  res.status(201).json({ id: result.insertId });
}));

router.get('/balances', wrap(async (req, res) => {
  const [rows] = await pool.query(`SELECT t.id, t.full_name, t.move_in_date, t.room_id, r.room_number, r.monthly_rent
    FROM tenants t LEFT JOIN rooms r ON r.id = t.room_id WHERE t.status = 'active' ORDER BY t.full_name`);
  const out = [];
  for (const t of rows) {
    const b = await balanceFor(t);
    out.push({ tenant_id: t.id, full_name: t.full_name, room_number: t.room_number, move_in_date: t.move_in_date, ...b });
  }
  out.sort((a, b) => b.balance - a.balance);
  res.json(out);
}));

export default router;
