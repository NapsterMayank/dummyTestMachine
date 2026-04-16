# Machine Repair Log

A minimal backend + frontend system for field technicians to log machine repairs fast — no typing required in 5-sec mode, saved in under 5 seconds.

---

## The Problem It Solves

A technician just fixed a machine. He needs to log what broke and what part he used — before he moves to the next job. Long forms kill this habit. This app makes it a few taps and one submit.

---

## Modes

### Standard Mode
Two text fields — type what broke and what part was used. Mic button available for voice input.

### 5-Sec Mode (no typing)
Toggle it on from the home screen. The log form changes to:
- **6 tap buttons** for issue type (universal categories — no pre-seeding needed)
- **6 tap buttons** for common parts — auto-selected based on machine type
- **Previously used parts** shown as chips (builds from your own logs)
- **Qty stepper** — `−` / `+` instead of a number input
- **"Other" fallback** — type a new part once, it saves as a chip for next time

Part suggestions by machine type:

| Machine | Common parts shown |
|---|---|
| Diesel Generator | Air Filter, Oil Filter, Belt, Battery, Fuel Filter, Starter Motor |
| Air Compressor | Air Filter, Belt, Valve, O-Ring, Pressure Switch, Oil |
| Water Pump | Seal, Impeller, Bearing, Gasket, Valve, Filter |
| Lift / Hoist | Wire Rope, Hook, Brake Pad, Oil, Limit Switch, Bearing |
| AC / HVAC | Filter, Capacitor, Contactor, Belt, Thermostat, Gas Valve |
| Motor / Engine | Belt, Bearing, Capacitor, Fuse, Oil Filter, Spark Plug |
| Others | Filter, Belt, Bearing, Fuse, Gasket, Seal |

Parts history is stored in `localStorage` — no backend changes needed.

---

## Flow

```
Open app
  └── See machine list
        └── Tap machine
              └── Standard: type issue + part → Log Repair
                  5-sec:    tap issue + tap part → Log Repair
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
| Log Repair | Issue + part (standard or 5-sec mode) → submit |
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

One request creates both the issue and the part together.

```json
POST /machines/1/log
{
  "issue_title": "Not starting",
  "part_name": "Starter Motor",
  "quantity": 1
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
- **Parts history** — `localStorage` (per-device, no backend required)

---

## Project Structure

```
/
├── server.js          # Express app — all routes
├── db.json            # Flat-file database (auto-created if missing)
├── public/
│   └── index.html     # Single-page frontend (standard + 5-sec mode)
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

The DB comes pre-seeded with 3 machines: Diesel Generator, Air Compressor, Water Pump.

---

## Viewing the Database

```bash
# Terminal
cat db.json

# Via API
curl http://localhost:3000/machines
curl http://localhost:3000/machines/1
```

---

## Design Decisions

**Why a flat JSON file instead of SQLite/Postgres?**
Zero setup. Anyone can clone and run in 30 seconds. For production, swap `db.json` with a real DB — the route logic stays the same.

**Why one `/log` endpoint instead of separate issue + part calls?**
The technician shouldn't need two round trips. One tap = one save = done.

**Why are common parts hard-coded by machine type?**
No pre-seeded data exists on first run. Machine-type inference from the name covers 80% of cases. The parts history fills in the rest over time.

**Why no auth?**
Out of scope for this version. Focused proof of concept for the logging flow.

---

## Resetting Data

Delete `db.json` and restart the server — it recreates empty.
To clear parts history in the browser: `localStorage.removeItem('mlog_parts')` in the console.
