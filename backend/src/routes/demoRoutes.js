const express = require("express");
const prisma = require("../lib/prisma");

const router = express.Router();

// ==========================================
// Demo: Get States
// ==========================================
router.get("/states", async (req, res) => {
    try {
        const states = await prisma.state.findMany({
            select: {
                code: true,
                name: true,
            },
            orderBy: {
                name: "asc",
            },
        });

        res.json({
            success: true,
            count: states.length,
            data: states,
        });
    } catch (error) {
        console.error("Demo states error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch states",
        });
    }
});

// ==========================================
// Demo: Get Districts by State
// ==========================================
router.get("/districts/:stateCode", async (req, res) => {
    try {
        const { stateCode } = req.params;

        const state = await prisma.state.findUnique({
            where: {
                code: stateCode,
            },
            select: {
                id: true,
                code: true,
                name: true,
            },
        });

        if (!state) {
            return res.status(404).json({
                success: false,
                message: "State not found",
            });
        }

        const districts = await prisma.district.findMany({
            where: {
                stateId: state.id,
            },
            select: {
                code: true,
                name: true,
            },
            orderBy: {
                name: "asc",
            },
        });

        res.json({
            success: true,
            stateCode: state.code,
            stateName: state.name,
            count: districts.length,
            data: districts,
        });
    } catch (error) {
        console.error("Demo districts error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch districts",
        });
    }
});

// ==========================================
// Demo: Get Sub-Districts by District
// ==========================================
router.get("/subdistricts/:districtCode", async (req, res) => {
    try {
        const { districtCode } = req.params;

        const district = await prisma.district.findUnique({
            where: {
                code: districtCode,
            },
            select: {
                id: true,
                code: true,
                name: true,
            },
        });

        if (!district) {
            return res.status(404).json({
                success: false,
                message: "District not found",
            });
        }

        const subDistricts = await prisma.subDistrict.findMany({
            where: {
                districtId: district.id,
            },
            select: {
                code: true,
                name: true,
            },
            orderBy: {
                name: "asc",
            },
        });

        res.json({
            success: true,
            districtCode: district.code,
            districtName: district.name,
            count: subDistricts.length,
            data: subDistricts,
        });
    } catch (error) {
        console.error("Demo sub-districts error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch sub-districts",
        });
    }
});

// ==========================================
// Demo: Search Villages
// ==========================================
router.get("/villages/search", async (req, res) => {
    try {
        const {
            q,
            page = "1",
            limit = "20",
        } = req.query;

        if (!q || q.trim().length < 2) {
            return res.status(400).json({
                success: false,
                message: "Search query must contain at least 2 characters",
            });
        }

        const pageNumber = parseInt(page);
        const limitNumber = parseInt(limit);

        if (
            isNaN(pageNumber) ||
            isNaN(limitNumber) ||
            pageNumber < 1 ||
            limitNumber < 1 ||
            limitNumber > 100
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Page must be >= 1 and limit must be between 1 and 100",
            });
        }

        const skip = (pageNumber - 1) * limitNumber;

        const where = {
            name: {
                contains: q.trim(),
                mode: "insensitive",
            },
        };

        const [villages, total] = await Promise.all([
            prisma.village.findMany({
                where,
                select: {
                    code: true,
                    name: true,
                    subDistrict: {
                        select: {
                            code: true,
                            name: true,
                            district: {
                                select: {
                                    code: true,
                                    name: true,
                                    state: {
                                        select: {
                                            code: true,
                                            name: true,
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
                skip,
                take: limitNumber,
                orderBy: {
                    name: "asc",
                },
            }),

            prisma.village.count({
                where,
            }),
        ]);

        res.json({
            success: true,
            page: pageNumber,
            limit: limitNumber,
            total,
            totalPages: Math.ceil(total / limitNumber),
            count: villages.length,
            data: villages,
        });
    } catch (error) {
        console.error("Demo village search error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to search villages",
        });
    }
});

// ==========================================
// Demo: Get Villages by Sub-District
// ==========================================
router.get("/villages/:subDistrictCode", async (req, res) => {
    try {
        const { subDistrictCode } = req.params;

        const subDistrict = await prisma.subDistrict.findUnique({
            where: {
                code: subDistrictCode,
            },
            select: {
                id: true,
                code: true,
                name: true,
            },
        });

        if (!subDistrict) {
            return res.status(404).json({
                success: false,
                message: "Sub-District not found",
            });
        }

        const villages = await prisma.village.findMany({
            where: {
                subDistrictId: subDistrict.id,
            },
            select: {
                code: true,
                name: true,
            },
            orderBy: {
                name: "asc",
            },
        });

        res.json({
            success: true,
            subDistrictCode: subDistrict.code,
            subDistrictName: subDistrict.name,
            count: villages.length,
            data: villages,
        });
    } catch (error) {
        console.error("Demo villages error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch villages",
        });
    }
});

module.exports = router;