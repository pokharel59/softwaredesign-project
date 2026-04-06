const express = require('express');
const redis = require('redis');

const app = express();
const PORT = 3000;
const client = redis.createClient();
const inFlightRequests = new Map();

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
    const cached = await client.get(key);
    if (cached) {
      return res.json({
        source: "cache",
        latency: `${Date.now() - start} ms`,
        data: JSON.parse(cached)
      });
    }

    // 2. Check if request already in progress
    if (inFlightRequests.has(key)) {
      console.log("WAITING FOR EXISTING REQUESTS");

      const data = await inFlightRequests.get(key);

      return res.json({
        source: "deduplication",
        latency: `${Date.now() - start} ms`,
        data
      });
    }

    console.log("NEW FETCH");

    // 3. Create promise and store it
    const fetchPromise = (async () => {
      const response = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=27.7&longitude=85.3&current_weather=true`
      );

      const data = await response.json();

      // 3. Store in Redis (TTL = 60s)
      await client.setEx(key, 300, JSON.stringify(data));

      return data;
    })();

    inFlightRequests.set(key, fetchPromise);

    const data = await fetchPromise;

    // 4. Clean up in-flight map
    inFlightRequests.delete(key);

    return res.json({
      source: "external API",
      latency: `${Date.now() - start} ms`,
      data
    });

  } catch (err) {
    inFlightRequests.delete(key); // Ensure cleanup on error
    console.error("Error:", err);
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});