import { Router } from 'express';
import { pool } from '../db.js';
import { requireAuth } from '../auth.js';
import { wrap, balanceFor, syncRoomStatus } from '../helpers.js';

const router = Router();
router.use(requireAuth);

router.get('/', wrap(async (req, res) => {
  const { status = 'active', q = '' } = req.query;
  let sql = `SELECT t.*, r.room_number, r.monthly_rent FROM tenants t LEFT JOIN rooms r ON r.id = t.room_id WHERE 1=1`;
  const params = [];
  if (status !== 'all') { sql += ' AND t.status = ?'; params.push(status); }
  if (q) { sql += ' AND (t.full_name LIKE ? OR r.room_number LIKE ?)'; params.push('%' + q + '%', '%' + q + '%'); }
  sql += ' ORDER BY t.created_at DESC';
  const [rows] = await pool.query(sql, params);
  for (const t of rows) if (t.status === 'active') t.balance = (await balanceFor(t)).balance;
  res.json(rows);
}));

router.get('/:id', wrap(async (req, res) => {
  const [rows] = await pool.query(`SELECT t.*, r.room_number, r.monthly_rent FROM tenants t LEFT JOIN rooms r ON r.id = t.room_id WHERE t.id = ?`, [req.params.id]);
  if (!rows.length) return res.status(404).json({ error: 'Tenant not found.' });
  const tenant = rows[0];
  const balance = await balanceFor(tenant);
  const [payments] = await pool.query('SELECT * FROM payments WHERE tenant_id = ? ORDER BY paid_at DESC', [req.params.id]);
  res.json({ tenant, balance, payments });
}));

router.post('/', wrap(async (req, res) => {
  const { full_name, contact_number = '', email = '', guardian_name = '', guardian_contact = '', room_id, move_in_date } = req.body || {};
  if (!full_name || !String(full_name).trim()) return res.status(400).json({ error: 'Full name is required.' });
  if (!room_id) return res.status(400).json({ error: 'Please assign a room.' });
  if (!move_in_date) return res.status(400).json({ error: 'Move-in date is required.' });
  const [rooms] = await pool.query('SELECT * FROM rooms WHERE id = ?', [room_id]);
  if (!rooms.length) return res.status(400).json({ error: 'Room not found.' });
  if (rooms[0].status === 'maintenance') return res.status(400).json({ error: 'That room is under maintenance.' });
  const [counts] = await pool.query("SELECT COUNT(*) AS c FROM tenants WHERE room_id = ? AND status = 'active'", [room_id]);
  if (counts[0].c >= rooms[0].capacity) return res.status(400).json({ error: 'That room is already full.' });
  const [result] = await pool.query(`INSERT INTO tenants (full_name, contact_number, email, guardian_name, guardian_contact, room_id, move_in_date)
    VALUES (?, ?, ?, ?, ?, ?, ?)`, [String(full_name).trim(), contact_number, email, guardian_name, guardian_contact, room_id, move_in_date]);
  await syncRoomStatus(room_id);
  res.status(201).json({ id: result.insertId });
}));

router.patch('/:id', wrap(async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM tenants WHERE id = ?', [req.params.id]);
  if (!rows.length) return res.status(404).json({ error: 'Tenant not found.' });
  const tenant = rows[0];
  const full_name = req.body.full_name !== undefined ? req.body.full_name : tenant.full_name;
  const contact_number = req.body.contact_number !== undefined ? req.body.contact_number : tenant.contact_number;
  const email = req.body.email !== undefined ? req.body.email : tenant.email;
  const guardian_name = req.body.guardian_name !== undefined ? req.body.guardian_name : tenant.guardian_name;
  const guardian_contact = req.body.guardian_contact !== undefined ? req.body.guardian_contact : tenant.guardian_contact;
  const move_in_date = req.body.move_in_date !== undefined ? req.body.move_in_date : tenant.move_in_date;
  let roomId = req.body.room_id !== undefined ? req.body.room_id : tenant.room_id;
  if (tenant.status === 'moved_out') roomId = tenant.room_id;
  if (roomId) {
    const [rooms] = await pool.query('SELECT * FROM rooms WHERE id = ?', [roomId]);
    if (rooms.length) {
      if (rooms[0].status === 'maintenance' && Number(roomId) !== Number(tenant.room_id)) return res.status(400).json({ error: 'That room is under maintenance.' });
      const [counts] = await pool.query("SELECT COUNT(*) AS c FROM tenants WHERE room_id = ? AND status = 'active' AND id <> ?", [roomId, req.params.id]);
      if (counts[0].c >= rooms[0].capacity) return res.status(400).json({ error: 'That room is already full.' });
    }
  }
  await pool.query(`UPDATE tenants SET full_name = ?, contact_number = ?, email = ?, guardian_name = ?, guardian_contact = ?, room_id = ?, move_in_date = ? WHERE id = ?`,
    [full_name, contact_number, email, guardian_name, guardian_contact, roomId, move_in_date, req.params.id]);
  if (Number(roomId) !== Number(tenant.room_id)) { await syncRoomStatus(tenant.room_id); await syncRoomStatus(roomId); }
  res.json({ ok: true });
}));

router.post('/:id/move-out', wrap(async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM tenants WHERE id = ?', [req.params.id]);
  if (!rows.length) return res.status(404).json({ error: 'Tenant not found.' });
  if (rows[0].status !== 'active') return res.status(400).json({ error: 'This tenant already moved out.' });
  await pool.query("UPDATE tenants SET status = 'moved_out', move_out_date = CURDATE() WHERE id = ?", [req.params.id]);
  await syncRoomStatus(rows[0].room_id);
  res.json({ ok: true });
}));

export default router;
