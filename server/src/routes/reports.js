import { Router } from 'express';
import { pool } from '../db.js';
import { requireAuth } from '../auth.js';
import { wrap, round2 } from '../helpers.js';

const router = Router();
router.use(requireAuth);

router.get('/monthly', wrap(async (req, res) => {
  const year = String(req.query.year || new Date().getFullYear()).slice(0, 4);
  const [rows] = await pool.query(`SELECT period_month, COUNT(*) AS count, COALESCE(SUM(amount), 0) AS total
    FROM payments WHERE period_month LIKE ? GROUP BY period_month ORDER BY period_month`, [year + '-%']);
  res.json(rows.map(r => ({ period_month: r.period_month, count: r.count, total: round2(r.total) })));
}));

export default router;
