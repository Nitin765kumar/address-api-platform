const redis = require("../lib/redis");

const redisCache = (key, duration = 3600) => {
    return async (req, res, next) => {
        try {
            const cachedData = await redis.get(key);

            if (cachedData) {
                console.log(`Redis Cache HIT: ${key}`);

                return res.json(cachedData);
            }

            console.log(`Redis Cache MISS: ${key}`);

            const originalJson = res.json.bind(res);

            res.json = async (data) => {
                try {
                    await redis.set(key, data, {
                        ex: duration
                    });

                    console.log(`Data cached in Redis: ${key}`);
                } catch (error) {
                    console.error("Redis cache save error:", error);
                }

                return originalJson(data);
            };

            next();
        } catch (error) {
            console.error("Redis cache error:", error);
            next();
        }
    };
};

module.exports = redisCache;