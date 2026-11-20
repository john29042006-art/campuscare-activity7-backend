require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { pool, initializeDatabase } = require('./db');
const app = express();

const origins = (process.env.CLIENT_ORIGINS || '')
  .split(',').map(value => value.trim()).filter(Boolean);
app.use(cors({ origin: origins }));
app.use(express.json({ limit: '20kb' }));

// The marking guide can be viewed at the public base URL.
app.get('/', (req, res) => {
  const base = `${req.protocol}://${req.get('host')}`;
  const routes = [
    ['GET', '/', 'API guide'],
    ['GET', '/health', 'Database health'],
    ['GET', '/api/records', 'All records'],
    ['GET', '/api/records/:id', 'One record'],
    ['POST', '/api/records', 'Create record'],
    ['PUT', '/api/records/:id', 'Update record'],
    ['DELETE', '/api/records/:id', 'Delete record']
  ];
  res.type('html').send(`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>CampusCare API | ICT251</title><style>
  body{font:16px system-ui,sans-serif;line-height:1.55;color:#18304a;background:#f2f7f9;margin:0;padding:32px 16px}main{max-width:780px;margin:auto;background:white;padding:32px;border-radius:16px;box-shadow:0 5px 25px #00224410}h1{margin-top:0;color:#0d5261}table{border-collapse:collapse;width:100%}td,th{text-align:left;border-bottom:1px solid #dce6ed;padding:10px}code,pre{background:#f1f4f7;border-radius:5px;padding:3px 5px}pre{padding:12px;overflow:auto}a{color:#006c87} .muted{color:#50657a}</style></head><body><main>
  <h1>CampusCare — Maintenance Requests API</h1><p><b>Student:</b> PHIRI JOHN &nbsp; <b>Student number:</b> 202502668<br><b>Course:</b> ICT251, Activity 7</p>
  <p>Independent Node.js + Express API using a persistent PostgreSQL database. Create, read, edit and delete made-up campus maintenance requests.</p>
  <p><b>Live API base URL:</b> <code>${base}</code></p>
  <p><a href="/health">Database health</a> · <a href="/api/records">View all records (JSON)</a></p>
  <h2>API routes</h2><table><thead><tr><th>Method</th><th>Route</th><th>Purpose</th></tr></thead><tbody>${routes.map(r => `<tr><td>${r[0]}</td><td><code>${r[1]}</code></td><td>${r[2]}</td></tr>`).join('')}</tbody></table>
  <h2>Record format</h2><p><code>title</code> (3–80 characters), <code>category</code> (2–40), <code>description</code> (5–300), and <code>status</code> (one of Pending, In progress, Completed). Whitespace is trimmed. The database generates <code>id</code>; do not send it in POST/PUT.</p>
  <p><b>Example POST/PUT JSON body:</b></p><pre>{\n  "title": "Broken classroom light",\n  "category": "Electrical",\n  "description": "The light in Room B12 does not switch on.",\n  "status": "Pending"\n}</pre>
  <h2>Response codes</h2><p>GET / PUT / DELETE: 200 · POST: 201 · Bad input or malformed JSON: 400 · Missing record or route: 404 · Server error: 500 · Database health unavailable: 503. Errors return JSON with a <code>message</code> field. DELETE returns <code>{"message":"Record deleted."}</code>.</p>
  <p class="muted">An idle free hosting service may take some time to start. Test POST, PUT and DELETE with Postman or another API client.</p></main></body></html>`);
});

app.get('/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.status(200).json({ status: 'ok', database: 'connected' });
  } catch (error) {
    console.error('Health check failed:', error);
    res.status(503).json({ message: 'Database unavailable.' });
  }
});

app.use('/api/records', require('./routes/records'));
app.use((req, res) => res.status(404).json({ message: 'Route not found.' }));
app.use((error, req, res, next) => {
  if (error instanceof SyntaxError && error.status === 400 && 'body' in error) {
    return res.status(400).json({ message: 'Malformed JSON request body.' });
  }
  if (error.type === 'entity.too.large') {
    return res.status(400).json({ message: 'Request body is too large.' });
  }
  console.error('Unexpected error:', error);
  res.status(500).json({ message: 'Unexpected server failure.' });
});

const port = process.env.PORT || 3000;
initializeDatabase()
  .then(() => app.listen(port, '0.0.0.0', () => console.log(`CampusCare API listening on port ${port}`)))
  .catch(error => {
    console.error('Database initialization failed:', error);
    process.exitCode = 1;
    pool.end();
  });
