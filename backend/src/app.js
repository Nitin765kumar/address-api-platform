const express = require("express");
const cors = require("cors");
require("dotenv").config();

const stateRoutes = require("./routes/stateRoutes");
const districtRoutes = require("./routes/districtRoutes");
const subDistrictRoutes = require("./routes/subDistrictRoutes");
const villageRoutes = require("./routes/villageRoutes");
const authRoutes = require("./routes/authRoutes");
const apiKeyRoutes = require("./routes/apiKeyRoutes");

const apiRateLimiter = require("./middleware/rateLimitMiddleware");
const redisCache = require("./middleware/redisCacheMiddleware");
const stateAccessRoutes = require("./routes/stateAccessRoutes");
const demoRoutes = require("./routes/demoRoutes");

const app = express();

// ===============================
// Middleware
// ===============================
app.use(cors());
app.use(express.json());

// ===============================
// Test Route
// ===============================
app.get("/", (req, res) => {
    res.json({
        message: "Address API Platform is running",
        status: "success"
    });
});

// ===============================
// Authentication Routes
// ===============================
app.use("/api/auth", authRoutes);

// ===============================
// API Key Routes
// ===============================
app.use("/api/v1/api-keys", apiKeyRoutes);

// ===============================
// Address API Routes
// Rate Limited
// ===============================
app.use("/api/v1", apiRateLimiter);
app.use("/api/demo", demoRoutes);

app.use(
    "/api/v1/states",
    redisCache("states", 3600),
    stateRoutes
);
app.use("/api/v1/districts", districtRoutes);
app.use("/api/v1/subdistricts", subDistrictRoutes);
app.use("/api/v1/villages", villageRoutes);
app.use("/api/v1/state-access", stateAccessRoutes);

// ===============================
// 404 Handler
// ===============================
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: "API endpoint not found"
    });
});

// ===============================
// Server
// ===============================
const PORT = process.env.PORT || 5000;

// Local development
if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
    });
}

// Export app for Vercel
module.exports = app;