require("dotenv").config();

const redis = require("./lib/redis");

async function testRedis() {
    try {
        await redis.set("address-api-test", "Redis is working");

        const value = await redis.get("address-api-test");

        console.log("Redis connection successful!");
        console.log("Test value:", value);
    } catch (error) {
        console.error("Redis connection failed:", error);
    }
}

testRedis();