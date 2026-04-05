const express = require('express');
const redis = require('redis');

const app = express();
const PORT = 3000;
const client = redis.createClient();

client.on('error', (err) => {
  console.error('Redis error:', err);
});

(async () => {
  await client.connect();
})();

app.get('/weather', async (req, res) => {
  const city = req.query.city || "Kathmandu";
  const key = `weather:${city}`;

  try {
    const start = Date.now();

    // 1. Check cache
    const cachedData = await client.get(key);

    if (cachedData) {
      const end = Date.now();

      console.log("CACHE HIT");

      return res.json({
        source: "cache",
        latency: `${end - start} ms`,
        data: JSON.parse(cachedData)
      });
    }

    console.log("CACHE MISS");

    // 2. Fetch from external API
    const response = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=27.7&longitude=85.3&current_weather=true`
    );

    const data = await response.json();

    // 3. Store in Redis (TTL = 60s)
    await client.setEx(key, 60, JSON.stringify(data));

    setTimeout(async () => {
      const value = await client.get(key);
      if (value === null) {
        console.log("TTL expired");
      }
    }, 61000); // slightly more than TTL

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