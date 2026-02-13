const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const app = express();
const PORT = 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

// --- MOCK DATABASE ---
let user = {
    name: "Ambu",
    exam_start: "2026-03-10", 
    exam_end: "2026-03-24",
    normal_limit: 60, 
    last_settings_update: null,
    exams: [
        { subject: "Mathematics", date: "2026-03-10" },
        { subject: "Physics", date: "2026-03-12" }
    ]
};

let websites = [
    { id: 1, name: "YouTube", used: 10, limit: 60 },
    { id: 2, name: "Instagram", used: 5, limit: 30 }
];

// --- SMART LOGIC ---
function getModeAndLimit() {
    const today = new Date();
    const start = new Date(user.exam_start);
    const end = new Date(user.exam_end);
    const prepStart = new Date(start);
    prepStart.setDate(start.getDate() - 7);

    // 🔴 EXAM SERIES
    if (today >= start && today <= end) {
        return { mode: "🔴 EXAM SERIES", limit: 15, message: "Strict Mode Active. Limits reduced to 15m." };
    }
    // 🟡 PREP WEEK
    if (today >= prepStart && today < start) {
        return { mode: "🟡 PREP WEEK", limit: Math.floor(user.normal_limit / 2), message: "Study Mode. Limits Halved." };
    }
    // 🟢 NORMAL
    return { mode: "🟢 NORMAL", limit: user.normal_limit, message: "Normal Schedule Active." };
}

// --- API ROUTES ---
app.get('/api/dashboard', (req, res) => {
    const status = getModeAndLimit();
    const dynamicWebsites = websites.map(w => ({
        ...w,
        limit: (w.name === "YouTube") ? status.limit : Math.floor(status.limit / 2)
    }));
    const sortedExams = user.exams.sort((a,b) => new Date(a.date) - new Date(b.date));
    const nextExam = sortedExams.find(e => new Date(e.date) >= new Date()) || sortedExams[0];

    res.json({
        user,
        mode: status.mode,
        message: status.message,
        websites: dynamicWebsites,
        nextExam: nextExam
    });
});

app.post('/api/settings', (req, res) => {
    const { limit } = req.body;
    const today = new Date();
    const status = getModeAndLimit();

    if (status.mode.includes("EXAM")) {
        return res.json({ status: "error", message: "🚫 LOCKED! Cannot change limits during exams." });
    }

    if (user.last_settings_update) {
        const lastUpdate = new Date(user.last_settings_update);
        const diffDays = Math.ceil(Math.abs(today - lastUpdate) / (1000 * 60 * 60 * 24));
        if (diffDays < 7) {
            return res.json({ status: "error", message: `⏳ LOCKED! Discipline active. Wait ${7 - diffDays} days.` });
        }
    }

    user.normal_limit = parseInt(limit);
    user.last_settings_update = today.toISOString();
    res.json({ status: "success", message: "✅ Settings Updated!" });
});

app.post('/api/schedule', (req, res) => {
    const { start, end } = req.body;
    if(start) user.exam_start = start;
    if(end) user.exam_end = end;
    res.json({ status: "success", message: "📅 Series Range Updated!" });
});

app.post('/api/add-exam', (req, res) => {
    const { subject, date } = req.body;
    if(subject && date) {
        user.exams.push({ subject, date });
        res.json({ status: "success", message: "✅ Exam Added to Calendar!" });
    } else {
        res.status(400).json({ status: "error", message: "Missing data" });
    }
});

app.listen(PORT, () => console.log(`🚀 FocusLock running at http://localhost:${PORT}`));