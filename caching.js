const express = require('express');

const app = express();
const PORT = 3000;

app.get('/weather', async (req, res) => {
  const city = req.query.city || "Kathmandu";

  try {
    const start = Date.now();

    const response = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=27.7&longitude=85.3&current_weather=true`
    );

    const data = await response.json();

    const end = Date.now();

    console.log(`API call took: ${end - start} ms`);

    res.json({
      source: "external API",
      latency: `${end - start} ms`,
      data
    });

  } catch (err) {
    console.error("Error:", err);
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});