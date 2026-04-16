const express = require('express');
const multer = require('multer');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.static(path.join(__dirname, 'public')));

// --- Storage: flat JSON file, no native deps needed ---
const DB_FILE = path.join(__dirname, 'db.json');

function readDB() {
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify({ machines: [], issues: [], parts: [] }));
  }
  return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
}

function writeDB(data) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

function nextId(arr) {
  return arr.length === 0 ? 1 : Math.max(...arr.map(r => r.id)) + 1;
}

// --- Multer: local file upload ---
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, 'uploads')),
  filename: (req, file, cb) => cb(null, `${Date.now()}_${file.originalname}`)
});
const upload = multer({ storage });

// Image parsing happens client-side via Anthropic API (auth handled in browser)
// Server just receives the extracted fields as part of the multipart form

// =================== ROUTES ===================

// POST /machines — upload image, create machine
app.post('/machines', upload.single('image'), (req, res) => {
  const db = readDB();
  const imagePath = req.file ? req.file.path : null;
  const imageFile = req.file ? req.file.filename : null;

  // Client sends extracted fields from vision API
  const machine = {
    id: nextId(db.machines),
    name: req.body.name || 'Unnamed Machine',
    manufacturer: req.body.manufacturer || null,
    model: req.body.model || null,
    serial_no: req.body.serial_no || null,
    mfg_date: req.body.mfg_date || null,
    type: req.body.type || 'Other',
    image_file: imageFile,
    created_at: new Date().toISOString()
  };

  db.machines.push(machine);
  writeDB(db);
  res.json(machine);
});

// GET /machines/:id — full history
app.get('/machines/:id', (req, res) => {
  const db = readDB();
  const machine = db.machines.find(m => m.id === parseInt(req.params.id));
  if (!machine) return res.status(404).json({ error: 'Machine not found' });

  const issues = db.issues
    .filter(i => i.machine_id === machine.id)
    .map(issue => ({
      ...issue,
      parts: db.parts.filter(p => p.issue_id === issue.id)
    }));

  res.json({ ...machine, issues });
});

// GET /machines — list all
app.get('/machines', (req, res) => {
  const db = readDB();
  res.json(db.machines);
});

// POST /machines/:id/issues — log issue
app.post('/machines/:id/issues', (req, res) => {
  const db = readDB();
  const machine = db.machines.find(m => m.id === parseInt(req.params.id));
  if (!machine) return res.status(404).json({ error: 'Machine not found' });

  const issue = {
    id: nextId(db.issues),
    machine_id: machine.id,
    title: req.body.title,
    description: req.body.description || null,
    status: 'open',
    created_at: new Date().toISOString()
  };

  db.issues.push(issue);
  writeDB(db);
  res.json(issue);
});

// POST /issues/:id/parts — add part
app.post('/issues/:id/parts', (req, res) => {
  const db = readDB();
  const issue = db.issues.find(i => i.id === parseInt(req.params.id));
  if (!issue) return res.status(404).json({ error: 'Issue not found' });

  const part = {
    id: nextId(db.parts),
    issue_id: issue.id,
    part_name: req.body.part_name,
    quantity: req.body.quantity || 1,
    created_at: new Date().toISOString()
  };

  db.parts.push(part);
  writeDB(db);
  res.json(part);
});

// POST /machines/:id/log — single shot: create issue + part in one request
app.post('/machines/:id/log', (req, res) => {
  const db = readDB();
  const machine = db.machines.find(m => m.id === parseInt(req.params.id));
  if (!machine) return res.status(404).json({ error: 'Machine not found' });

  const issue = {
    id: nextId(db.issues),
    machine_id: machine.id,
    title: req.body.issue_title,
    description: req.body.description || null,
    status: 'resolved',
    created_at: new Date().toISOString()
  };
  db.issues.push(issue);

  const part = {
    id: nextId(db.parts),
    issue_id: issue.id,
    part_name: req.body.part_name,
    quantity: req.body.quantity || 1,
    created_at: new Date().toISOString()
  };
  db.parts.push(part);

  writeDB(db);
  res.json({ machine, issue, part });
});

const PORT = 3000;
app.listen(PORT, () => console.log(`Machine Log running on http://localhost:${PORT}`));
