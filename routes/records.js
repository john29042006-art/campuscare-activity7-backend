const router = require('express').Router();
const { pool } = require('../db');

function parseId(value) {
  if (!/^[1-9]\d*$/.test(value)) return null;
  const id = Number(value);
  return Number.isSafeInteger(id) && id <= 2147483647 ? id : null;
}

function validate(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return { error: 'Provide a JSON object with title, category, description and status.' };
  }
  const limits = { title: [3, 80], category: [2, 40], description: [5, 300] };
  const cleaned = {};
  for (const [field, [min, max]] of Object.entries(limits)) {
    if (typeof body[field] !== 'string') return { error: `${field} must be text.` };
    cleaned[field] = body[field].trim();
    if (cleaned[field].length < min || cleaned[field].length > max) {
      return { error: `${field[0].toUpperCase() + field.slice(1)} must have ${min} to ${max} characters.` };
    }
  }
  if (typeof body.status !== 'string') return { error: 'Status must be text.' };
  cleaned.status = body.status.trim();
  if (!['Pending', 'In progress', 'Completed'].includes(cleaned.status)) {
    return { error: 'Status must be Pending, In progress or Completed.' };
  }
  return { data: cleaned };
}

router.get('/', async (req, res, next) => {
  try {
    const result = await pool.query('SELECT id, title, category, description, status FROM records ORDER BY id');
    res.status(200).json(result.rows);
  } catch (error) { next(error); }
});

router.get('/:id', async (req, res, next) => {
  const id = parseId(req.params.id);
  if (!id) return res.status(400).json({ message: 'ID must be a positive whole number.' });
  try {
    const result = await pool.query('SELECT id, title, category, description, status FROM records WHERE id = $1', [id]);
    if (!result.rowCount) return res.status(404).json({ message: 'Record not found.' });
    res.status(200).json(result.rows[0]);
  } catch (error) { next(error); }
});

router.post('/', async (req, res, next) => {
  const { error, data } = validate(req.body);
  if (error) return res.status(400).json({ message: error });
  try {
    const result = await pool.query(
      'INSERT INTO records (title, category, description, status) VALUES ($1, $2, $3, $4) RETURNING id, title, category, description, status',
      [data.title, data.category, data.description, data.status]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) { next(error); }
});

router.put('/:id', async (req, res, next) => {
  const id = parseId(req.params.id);
  if (!id) return res.status(400).json({ message: 'ID must be a positive whole number.' });
  const { error, data } = validate(req.body);
  if (error) return res.status(400).json({ message: error });
  try {
    const result = await pool.query(
      'UPDATE records SET title = $1, category = $2, description = $3, status = $4 WHERE id = $5 RETURNING id, title, category, description, status',
      [data.title, data.category, data.description, data.status, id]
    );
    if (!result.rowCount) return res.status(404).json({ message: 'Record not found.' });
    res.status(200).json(result.rows[0]);
  } catch (error) { next(error); }
});

router.delete('/:id', async (req, res, next) => {
  const id = parseId(req.params.id);
  if (!id) return res.status(400).json({ message: 'ID must be a positive whole number.' });
  try {
    const result = await pool.query('DELETE FROM records WHERE id = $1 RETURNING id', [id]);
    if (!result.rowCount) return res.status(404).json({ message: 'Record not found.' });
    res.status(200).json({ message: 'Record deleted.' });
  } catch (error) { next(error); }
});

module.exports = router;
