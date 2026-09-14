const express = require("express");
const prisma = require("../lib/prisma");
const apiKeyMiddleware = require("../middleware/apiKeyMiddleware");

const router = express.Router();


// ==========================================
// Search Villages
// ==========================================
router.get("/search", apiKeyMiddleware, async (req, res) => {
    try {
        const { q, page = "1", limit = "20" } = req.query;

        if (!q || q.trim().length < 2) {
            return res.status(400).json({
                success: false,
                message: "Search query must contain at least 2 characters"
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
                message: "Page must be >= 1 and limit must be between 1 and 100"
            });
        }

        const skip = (pageNumber - 1) * limitNumber;

        const where = {
            name: {
                contains: q.trim(),
                mode: "insensitive"
            },

            // Only search villages from states
            // that the authenticated user can access
            subDistrict: {
                district: {
                    state: {
                        userAccesses: {
                            some: {
                                userId: req.apiKey.userId
                            }
                        }
                    }
                }
            }
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
                                            name: true
                                        }
                                    }
                                }
                            }
                        }
                    }
                },
                skip,
                take: limitNumber,
                orderBy: {
                    name: "asc"
                }
            }),

            prisma.village.count({
                where
            })
        ]);

        res.json({
            success: true,
            page: pageNumber,
            limit: limitNumber,
            total,
            totalPages: Math.ceil(total / limitNumber),
            count: villages.length,
            data: villages
        });

    } catch (error) {
        console.error("Error searching villages:", error);

        res.status(500).json({
            success: false,
            message: "Failed to search villages"
        });
    }
});


// ==========================================
// Get Villages by Sub-District
// ==========================================
router.get("/:subDistrictCode", apiKeyMiddleware, async (req, res) => {
    try {
        const { subDistrictCode } = req.params;

        // Find sub-district with its district and state
        const subDistrict = await prisma.subDistrict.findUnique({
            where: {
                code: subDistrictCode
            },
            select: {
                id: true,
                code: true,
                name: true,
                district: {
                    select: {
                        stateId: true
                    }
                }
            }
        });

        if (!subDistrict) {
            return res.status(404).json({
                success: false,
                message: "Sub-District not found"
            });
        }

        // Check user's access to the state
        const access = await prisma.userStateAccess.findUnique({
            where: {
                userId_stateId: {
                    userId: req.apiKey.userId,
                    stateId: subDistrict.district.stateId
                }
            }
        });

        if (!access) {
            return res.status(403).json({
                success: false,
                message: "You do not have access to this state"
            });
        }

        // Fetch villages
        const villages = await prisma.village.findMany({
            where: {
                subDistrictId: subDistrict.id
            },
            select: {
                code: true,
                name: true
            },
            orderBy: {
                name: "asc"
            }
        });

        res.json({
            success: true,
            subDistrictCode: subDistrict.code,
            subDistrictName: subDistrict.name,
            count: villages.length,
            data: villages
        });

    } catch (error) {
        console.error("Error fetching villages:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch villages"
        });
    }
});


module.exports = router;