# Machine Repair Log

A minimal backend + frontend system for field technicians to log machine repairs fast — issue reported and part used, saved in under 10 seconds.

---

## The Problem It Solves

A technician just fixed a machine. He needs to log what broke and what part he used — before he moves to the next job. Long forms kill this habit. This app makes it 2 fields and 1 tap.

---

## Flow

```
Open app
  └── See machine list (pre-seeded)
        └── Tap machine
              └── Fill: What broke? + Part replaced
                    └── Tap "Log Repair" → saved to DB
```

If the machine doesn't exist yet:
```
Tap "+ Add New Machine"
  └── Take photo (name auto-suggested, can edit)
        └── Confirm → goes straight to Log Repair screen
```

---

## Screens

| Screen | Purpose |
|--------|---------|
| Machine List | Pick which machine you're standing in front of |
| Log Repair | 2 fields — issue title + part name — then submit |
| Done | Confirms what was saved |
| New Machine | Photo + name → creates machine record |

---

## Data Model

```
machines
  id, name, type, image_file, created_at

issues
  id, machine_id, title, description, status, created_at

parts
  id, issue_id, part_name, quantity, created_at
```

**Relationships:**
- Machine → has many Issues
- Issue → has many Parts

Everything is stored in `db.json` (flat file, no database setup needed).

---

## API Endpoints

| Method | Endpoint | What it does |
|--------|----------|--------------|
| GET | `/machines` | List all machines |
| POST | `/machines` | Create a machine (multipart: image + name) |
| GET | `/machines/:id` | Get machine + all its issues and parts |
| POST | `/machines/:id/log` | **Main endpoint** — log issue + part in one request |
| POST | `/machines/:id/issues` | Log issue only |
| POST | `/issues/:id/parts` | Add part to an issue |

### Key endpoint — `/machines/:id/log`

This is the fast-log endpoint. One request creates both the issue and the part together.

```json
POST /machines/1/log
{
  "issue_title": "Not starting",
  "part_name": "Starter Motor"
}
```

Response:
```json
{
  "machine": { "id": 1, "name": "Diesel Generator", ... },
  "issue":   { "id": 1, "title": "Not starting", "status": "resolved", ... },
  "part":    { "id": 1, "part_name": "Starter Motor", "quantity": 1, ... }
}
```

---

## Tech Stack

- **Backend** — Node.js + Express
- **Storage** — JSON flat file (`db.json`) — no database installation needed
- **File uploads** — Multer (images saved to `/uploads`)
- **Frontend** — Single HTML file, no framework, no build step

---

## Project Structure

```
/
├── server.js          # Express app — all routes
├── db.json            # Flat-file database (auto-created if missing)
├── public/
│   └── index.html     # Single-page frontend
├── uploads/           # Machine photos stored here
└── package.json
```

---

## How to Run

**1. Install dependencies**
```bash
npm install
```

**2. Start the server**
```bash
node server.js
```

**3. Open the app**
```
http://localhost:3000
```

The DB comes pre-seeded with 3 machines:
- Diesel Generator
- Air Compressor
- Water Pump

---

## Viewing the Database

Since storage is a flat JSON file, you can inspect it any time:

```bash
# In terminal
cat db.json

# Or via API
curl http://localhost:3000/machines
curl http://localhost:3000/machines/1
```

---

## Design Decisions

**Why a flat JSON file instead of SQLite/Postgres?**
Zero setup. Anyone can clone and run in 30 seconds. For a production system, swap `db.json` with a real DB — the route logic stays the same.

**Why one `/log` endpoint instead of separate issue + part calls?**
The technician shouldn't need two round trips. One tap = one save = done.

**Why no auth?**
Out of scope for this version. This is a focused proof of concept for the logging flow.

---

## Seeded Data

`db.json` ships with 3 machines so you can test the flow immediately without setup.
To reset: delete `db.json` and restart the server — it will recreate empty, or re-seed manually.
