import { pool } from './db.js';

export const wrap = fn => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
export const round2 = n => Math.round(Number(n) * 100) / 100;

export function monthsElapsed(moveIn, moveOut) {
  const start = new Date(moveIn + 'T00:00:00');
  const end = moveOut ? new Date(moveOut + 'T00:00:00') : new Date();
  const months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth()) + 1;
  return Math.max(months, 1);
}

export async function balanceFor(tenant) {
  if (!tenant.room_id || !tenant.monthly_rent) return { due: 0, paid: 0, balance: 0 };
  const due = round2(Number(tenant.monthly_rent) * monthsElapsed(tenant.move_in_date, tenant.move_out_date));
  const [rows] = await pool.query('SELECT COALESCE(SUM(amount), 0) AS paid FROM payments WHERE tenant_id = ?', [tenant.id]);
  const paid = round2(rows[0].paid);
  return { due, paid, balance: round2(due - paid) };
}

export async function syncRoomStatus(roomId) {
  if (!roomId) return;
  const [rows] = await pool.query(
    "SELECT COUNT(*) AS c FROM tenants WHERE room_id = ? AND status = 'active'",
    [roomId]
  );
  const status = rows[0].c > 0 ? 'occupied' : 'vacant';
  await pool.query(
    "UPDATE rooms SET status = ? WHERE id = ? AND status <> 'maintenance'",
    [status, roomId]
  );
}
