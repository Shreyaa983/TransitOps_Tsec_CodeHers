import Driver from "../models/driver.model.js";
import { buildCrudController } from "./crud.controller.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const crud = buildCrudController(Driver);

// PATCH /drivers/:id/status
const updateStatus = asyncHandler(async (req, res) => {
    const { status } = req.body;

    const allowed = [
        "AVAILABLE",
        "ON_TRIP",
        "OFF_DUTY",
        "SUSPENDED",
    ];

    if (!allowed.includes(status)) {
        return res.status(400).json({
            success: false,
            message: "Invalid driver status",
        });
    }

    const driver = await Driver.findByIdAndUpdate(
        req.params.id,
        { status },
        { new: true, runValidators: true }
    );

    if (!driver) {
        return res.status(404).json({
            success: false,
            message: "Driver not found",
        });
    }

    res.json({
        success: true,
        data: driver,
    });
});

// PATCH /drivers/me/status
const updateMyStatus = asyncHandler(async (req, res) => {
    if (req.user?.role === "DRIVER") {
        return res.status(403).json({
            success: false,
            message: "Drivers are not authorized to set their own availability status. Contact a Dispatcher.",
        });
    }

    const { status } = req.body;

    const allowed = ["AVAILABLE", "ON_TRIP", "OFF_DUTY", "SUSPENDED"];
    const normalized = status?.toUpperCase();

    if (!allowed.includes(normalized)) {
        return res.status(400).json({
            success: false,
            message: "Invalid driver status",
        });
    }

    const driverId = req.user.driver?._id ?? req.user.driver;
    let driver = driverId ? await Driver.findById(driverId) : null;

    if (!driver) {
        driver = await Driver.findOne({ user: req.user._id });
    }

    if (!driver) {
        return res.status(404).json({
            success: false,
            message: "No driver profile linked to this user",
        });
    }

    driver.status = normalized;
    await driver.save();

    res.json({
        success: true,
        data: driver,
    });
});

// GET /drivers/available
const getAvailableDrivers = asyncHandler(async (_req, res) => {
    const today = new Date();

    const drivers = await Driver.find({
        status: "AVAILABLE",
        licenseExpiry: { $gte: today },
    }).populate("user", "name email");

    res.json({
        success: true,
        data: drivers,
    });
});

// GET /drivers/eligible
const getEligibleDrivers = asyncHandler(async (_req, res) => {
    const today = new Date();

    const drivers = await Driver.find({
        status: "AVAILABLE",
        licenseExpiry: { $gte: today },
    })
        .populate("user", "name email")
        .select(
            "user name licenseNumber licenseCategory licenseExpiry phone safetyScore status"
        );

    res.json({
        success: true,
        data: drivers,
    });
});

// GET /drivers/license-expiring
const getExpiringLicenses = asyncHandler(async (req, res) => {
    const days = Number(req.query.days) || 30;

    const today = new Date();
    const future = new Date();

    future.setDate(today.getDate() + days);

    const drivers = await Driver.find({
        licenseExpiry: {
            $gte: today,
            $lte: future,
        },
    }).populate("user", "name email");

    res.json({
        success: true,
        data: drivers,
    });
});

// GET /drivers/suspended
const getSuspendedDrivers = asyncHandler(async (_req, res) => {
    const drivers = await Driver.find({
        status: "SUSPENDED",
    }).populate("user", "name email");

    res.json({
        success: true,
        data: drivers,
    });
});

// GET /drivers/:id/license
const getLicenseDetails = asyncHandler(async (req, res) => {
    const driver = await Driver.findById(req.params.id)
        .populate("user", "name email")
        .select(
            "user licenseNumber licenseCategory licenseExpiry"
        );

    if (!driver) {
        return res.status(404).json({
            success: false,
            message: "Driver not found",
        });
    }

    res.json({
        success: true,
        data: driver,
    });
});

export default {
    ...crud,

    updateStatus,
    updateMyStatus,

    getAvailableDrivers,
    getEligibleDrivers,
    getExpiringLicenses,
    getSuspendedDrivers,
    getLicenseDetails,
};