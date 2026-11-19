import { Router } from 'express';
import { pool } from '../db.js';
import { requireAuth } from '../auth.js';
import { wrap, round2, syncRoomStatus } from '../helpers.js';

const router = Router();
router.use(requireAuth);

router.get('/', wrap(async (req, res) => {
  const [rows] = await pool.query(`SELECT r.*,
    (SELECT COUNT(*) FROM tenants t WHERE t.room_id = r.id AND t.status = 'active') AS occupants,
    (SELECT GROUP_CONCAT(t.full_name SEPARATOR ', ') FROM tenants t WHERE t.room_id = r.id AND t.status = 'active') AS tenant_names
    FROM rooms r ORDER BY r.room_number`);
  res.json(rows);
}));

router.post('/', wrap(async (req, res) => {
  const { room_number, capacity, monthly_rent } = req.body || {};
  const cap = Number(capacity) || 1;
  const rent = Number(monthly_rent);
  if (!room_number || !String(room_number).trim()) return res.status(400).json({ error: 'Room number is required.' });
  if (cap < 1) return res.status(400).json({ error: 'Capacity must be at least 1.' });
  if (!rent || rent <= 0) return res.status(400).json({ error: 'Monthly rent must be greater than zero.' });
  try {
    const [result] = await pool.query('INSERT INTO rooms (room_number, capacity, monthly_rent) VALUES (?, ?, ?)', [String(room_number).trim(), cap, round2(rent)]);
    res.status(201).json({ id: result.insertId });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return res.status(400).json({ error: 'That room number already exists.' });
    throw err;
  }
}));

router.patch('/:id', wrap(async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM rooms WHERE id = ?', [req.params.id]);
  if (!rows.length) return res.status(404).json({ error: 'Room not found.' });
  const room = rows[0];
  const capacity = req.body.capacity !== undefined ? Number(req.body.capacity) : room.capacity;
  const monthly_rent = req.body.monthly_rent !== undefined ? Number(req.body.monthly_rent) : Number(room.monthly_rent);
  let status = room.status;
  if (req.body.status !== undefined) {
    if (!['vacant', 'maintenance'].includes(req.body.status)) return res.status(400).json({ error: "Status can only be set to 'vacant' or 'maintenance'." });
    status = req.body.status;
  }
  if (capacity < 1) return res.status(400).json({ error: 'Capacity must be at least 1.' });
  if (!monthly_rent || monthly_rent <= 0) return res.status(400).json({ error: 'Monthly rent must be greater than zero.' });
  await pool.query('UPDATE rooms SET capacity = ?, monthly_rent = ?, status = ? WHERE id = ?', [capacity, round2(monthly_rent), status, req.params.id]);
  await syncRoomStatus(req.params.id);
  res.json({ ok: true });
}));

router.delete('/:id', wrap(async (req, res) => {
  const [rows] = await pool.query("SELECT COUNT(*) AS c FROM tenants WHERE room_id = ? AND status = 'active'", [req.params.id]);
  if (rows[0].c > 0) return res.status(400).json({ error: 'Cannot delete a room that has active tenants.' });
  await pool.query('DELETE FROM rooms WHERE id = ?', [req.params.id]);
  res.json({ ok: true });
}));

export default router;
