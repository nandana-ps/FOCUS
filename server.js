const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs-extra');
const app = express();
const PORT = 3000;
const DATA_FILE = './data.json';

app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

async function readDB() { try { return await fs.readJson(DATA_FILE); } catch (e) { return {}; } }
async function writeDB(data) { await fs.writeJson(DATA_FILE, data, { spaces: 2 }); }

function getStatus(user) {
    const today = new Date();
    today.setHours(0,0,0,0);
    const start = new Date(user.exam_start);
    const end = new Date(user.exam_end);
    const prep = new Date(start); 
    prep.setDate(start.getDate() - 7);

    if (today >= start && today <= end) return { mode: "🔴 EXAM SERIES", limit: 15, msg: "Strict Mode: 15m Limit." };
    if (today >= prep && today < start) return { mode: "🟡 PREP WEEK", limit: Math.floor(user.normal_limit/2), msg: "Study Mode: Limits Halved." };
    return { mode: "🟢 NORMAL", limit: user.normal_limit, msg: "Normal Schedule Active." };
}

app.post('/api/login', async (req, res) => {
    const data = await readDB();
    if (req.body.password === data.user.password) res.json({ status: "success", name: data.user.name });
    else res.status(401).json({ status: "error" });
});

app.get('/api/dashboard', async (req, res) => {
    const data = await readDB();
    const s = getStatus(data.user);
    const sites = data.websites.map(w => ({ ...w, limit: (w.name === "YouTube" ? s.limit : Math.floor(s.limit/2)) }));
    const next = data.user.exams.sort((a,b) => new Date(a.date) - new Date(b.date)).find(e => new Date(e.date) >= new Date());
    res.json({ user: data.user, mode: s.mode, message: s.msg, websites: sites, nextExam: next || {subject: "None", date: "--"} });
});

app.post('/api/save-range', async (req, res) => {
    const data = await readDB();
    data.user.exam_start = req.body.start;
    data.user.exam_end = req.body.end;
    await writeDB(data);
    res.json({ status: "success" });
});

app.post('/api/add-exam', async (req, res) => {
    const data = await readDB();
    data.user.exams.push(req.body);
    await writeDB(data);
    res.json({ status: "success" });
});

app.post('/api/settings', async (req, res) => {
    const data = await readDB();
    if (getStatus(data.user).mode.includes("EXAM")) return res.status(400).json({ message: "🚫 LOCKED during exams!" });
    data.user.normal_limit = parseInt(req.body.limit);
    await writeDB(data);
    res.json({ status: "success", message: "✅ Limits Updated!" });
});

app.listen(PORT, () => console.log(`🚀 FocusLock running at http://localhost:${PORT}`));