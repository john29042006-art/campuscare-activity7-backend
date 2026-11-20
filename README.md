# CampusCare — ICT251 Activity 7

Student: **PHIRI JOHN** · Student number: **202502668**

This is a standalone Node.js + Express + PostgreSQL backend for CampusCare. It is separate from Activity 6, and will be connected to the frontend in Activity 8.

## Files

- `server.js` — API guide, health check, middleware and error handling
- `routes/records.js` — GET, POST, PUT and DELETE routes and validation
- `db.js` — database pool and one-time initialization
- `schema.sql` — database tables
- `seed.sql` — eight made-up starting records, inserted only on the first initialization
- `.env.example` — example settings (never upload a real `.env`)

## Local steps

1. Install Node.js LTS, PostgreSQL (or use a cloud-hosted PostgreSQL database), and VS Code.
2. Open the `activity7-backend` folder in VS Code.
3. Run `npm install` (this creates/updates package-lock.json).
4. Copy `.env.example` to `.env` and replace `DATABASE_URL` with YOUR database connection string. Do not share it.
5. Run `npm start`, then open `http://localhost:3000`, `http://localhost:3000/health`, and `http://localhost:3000/api/records`.
6. Test POST, GET one, PUT, DELETE, invalid input, malformed JSON, missing IDs, and persistence after restarting using Postman.

### Example POST

`POST http://localhost:3000/api/records`

Header: `Content-Type: application/json`

Body:

```json
{
  "title": "Broken classroom light",
  "category": "Electrical",
  "description": "The light in Room B12 does not switch on.",
  "status": "Pending"
}
```

Expected: HTTP 201 and the saved record with its generated `id`.

## Deploy to Render

1. Create a **Postgres** database in your Render account and get its **internal database URL**. Keep it private.
2. Create a GitHub repository and upload the backend files, including `package.json` and `package-lock.json`. Do **not** upload `.env` or `node_modules`.
3. Render → New → Web Service → Connect repository → Node runtime → Free instance where available.
4. Build command: `npm install` (or `npm ci` with the lockfile). Start command: `npm start`.
5. Add environment variables in the Render dashboard:
   - `DATABASE_URL`: the database's internal connection URL (secret)
   - `CLIENT_ORIGINS`: `https://delightful-kleicha-ebeab0.netlify.app,http://localhost:5500,http://127.0.0.1:5500`
   - `DATABASE_SSL`: `false` for Render internal Postgres connections
6. Deploy. Open your assigned `https://...onrender.com/`, `/health`, and `/api/records` URLs.
7. Test the hosted CRUD routes independently (Postman or API client).
8. Submit only the **hosted backend base URL** for Activity 7.

**Important:** The lecturer's PDF conflicts: it calls for SQLite in one section, but also specifies `pg`, PostgreSQL placeholders `$1` and `RETURNING`, and a database connection pool. This project uses PostgreSQL to match the concrete code/commands. Confirm with the lecturer if SQLite is mandatory.

**Render hosting caution:** Render free web services have ephemeral filesystems; saving SQLite to the free web server filesystem would not reliably persist across restarts. Render's free PostgreSQL databases currently expire after 30 days, so keep track of the expiration date and ensure marking happens before expiry.

## For Activity 8

When the backend is live, keep the Activity 6 Netlify URL unchanged. Publish a **separate** integrated frontend with `js/config.js` pointing to your backend URL, and authorize the new Netlify origin in `CLIENT_ORIGINS`.
