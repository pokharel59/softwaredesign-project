const express = require('express');

const app = express();
const PORT = 3000;

// Middleware
app.use(express.json());

// Route
app.get('/', (req, res) => {
    res.send('Server is running');
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});