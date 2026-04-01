const express = require('express');
const os = require('os');
const { createClient } = require('redis');

const app = express();
const PORT = process.argv[2] || 3000;

let localCounter = 0;
const BATCH_SIZE = 50;

async function startServer() {
    const redisClient = createClient();

    redisClient.on('error', (err) => {
        console.error('Redis error:', err);
    });

    await redisClient.connect();

    app.get('/', async (req, res) => {
        // const counter = await redisClient.incr('counter');
        localCounter++;

        // Only hit Redis occasionally
        if (localCounter >= BATCH_SIZE) {
            await redisClient.incrBy('counter', localCounter);
            localCounter = 0;
        }

        res.json({
            message: "Click registered",
            count: localCounter, // Send the local counter value
            instance: os.hostname(),
            port: PORT
        });
    });

    // Flush remaining data on shutdown
    process.on('SIGINT', async () => {
        if (localCounter > 0) {
            await redisClient.incrBy('counter', localCounter);
        }
        process.exit(0);
    });


    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
}

startServer();