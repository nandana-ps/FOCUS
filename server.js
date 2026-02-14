const express = require('express');
const app = express();
const PORT = 3000;

app.use(express.static('public'));

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/dashboard.html');
});

app.listen(PORT, () => console.log(`🚀 FocusLock Dashboard: http://localhost:${PORT}`));