    import Trip from "../models/trip.model.js";
import Vehicle from "../models/vehicle.model.js";
import Driver from "../models/driver.model.js";
import { buildCrudController } from "./crud.controller.js";
import { createCrudService } from "../services/crud.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
    safeNotify,
    notifyTripDraftAssigned,
    notifyTripDispatched,
    notifyTripUpdated,
    notifyTripCancelled,
    notifyTripCompleted,
    notifyDriverReassigned,
    notifyVehicleChanged,
} from "../services/driver-notification.service.js";
import { env } from "../config/env.js";

const crud = buildCrudController(Trip);
const crudService = createCrudService(Trip);

// crud.list is overridden to filter for DRIVER role
const list = asyncHandler(async (req, res) => {
    let query = {};
    if (req.user?.role === 'DRIVER') {
        const driverId = req.user.driver?._id ?? req.user.driver;
        let driver = driverId ? await Driver.findById(driverId) : null;
        if (!driver) {
            driver = await Driver.findOne({ user: req.user._id });
        }
        if (!driver) {
            return res.status(200).json({ success: true, data: [] });
        }
        query.driver = driver._id;
    }
    const trips = await Trip.find(query)
        .populate('vehicle driver')
        .sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: trips });
});

// POST /trips (with custom validations)
const create = asyncHandler(async (req, res) => {
    const { vehicle: vehicleId, driver: driverId, cargoWeight } = req.body;

    // 1. Check if vehicle exists
    const vehicle = await Vehicle.findById(vehicleId);
    if (!vehicle) {
        return res.status(404).json({ success: false, message: "Vehicle not found" });
    }

    // 2. Check if driver exists
    const driver = await Driver.findById(driverId);
    if (!driver) {
        return res.status(404).json({ success: false, message: "Driver not found" });
    }

    // 3. Vehicle AVAILABLE
    if (vehicle.status !== "AVAILABLE") {
        return res.status(400).json({ success: false, message: `Vehicle is not AVAILABLE (currently: ${vehicle.status})` });
    }

    // 4. Driver AVAILABLE
    if (driver.status !== "AVAILABLE") {
        return res.status(400).json({ success: false, message: `Driver is not AVAILABLE (currently: ${driver.status})` });
    }

    // 5. Driver license not expired
    if (new Date(driver.licenseExpiry) < new Date()) {
        return res.status(400).json({ success: false, message: "Driver's license is expired" });
    }

    // 6. Cargo <= vehicle capacity
    if (cargoWeight > vehicle.maxLoadCapacity) {
        return res.status(400).json({ success: false, message: `Cargo weight (${cargoWeight}kg) exceeds vehicle capacity (${vehicle.maxLoadCapacity}kg)` });
    }

    // Force initial status to DRAFT
    req.body.status = "DRAFT";

    const document = await crudService.create(req.body);
    safeNotify(notifyTripDraftAssigned(document));
    res.status(201).json({ success: true, data: document });
});

// PATCH /trips/:id (block direct status update)
const update = asyncHandler(async (req, res) => {
    if (req.body.status) {
        return res.status(400).json({
            success: false,
            message: "Cannot update status directly. Use /dispatch, /complete, or /cancel endpoints instead."
        });
    }
    const existingTrip = await Trip.findById(req.params.id);
    if (!existingTrip) {
        return res.status(404).json({ success: false, message: "Trip not found" });
    }

    const document = await crudService.update(req.params.id, req.body);
    safeNotify(notifyTripUpdated(existingTrip, document));
    res.status(200).json({ success: true, data: document });
});

// PATCH /trips/:id/dispatch
const dispatchTrip = asyncHandler(async (req, res) => {
    const trip = await Trip.findById(req.params.id);
    if (!trip) {
        return res.status(404).json({ success: false, message: "Trip not found" });
    }

    if (trip.status !== "DRAFT") {
        return res.status(400).json({ success: false, message: `Only DRAFT trips can be dispatched (current: ${trip.status})` });
    }

    const vehicle = await Vehicle.findById(trip.vehicle);
    if (!vehicle) {
        return res.status(404).json({ success: false, message: "Assigned vehicle not found" });
    }

    const driver = await Driver.findById(trip.driver);
    if (!driver) {
        return res.status(404).json({ success: false, message: "Assigned driver not found" });
    }

    if (vehicle.status !== "AVAILABLE") {
        return res.status(400).json({ success: false, message: "Vehicle is not AVAILABLE" });
    }

    if (driver.status !== "AVAILABLE") {
        return res.status(400).json({ success: false, message: "Driver is not AVAILABLE" });
    }

    if (new Date(driver.licenseExpiry) < new Date()) {
        return res.status(400).json({ success: false, message: "Driver's license is expired" });
    }

    if (trip.cargoWeight > vehicle.maxLoadCapacity) {
        return res.status(400).json({ success: false, message: `Cargo weight exceeds vehicle capacity` });
    }

    trip.status = "DISPATCHED";
    trip.dispatchTime = new Date();
    if (!trip.scheduledStartTime) {
        trip.scheduledStartTime = new Date(Date.now() + env.tripReminderMinutes * 60 * 1000);
    }
    await trip.save();

    vehicle.status = "ON_TRIP";
    await vehicle.save();

    driver.status = "ON_TRIP";
    await driver.save();

    const populatedTrip = await Trip.findById(trip._id).populate("vehicle driver");
    safeNotify(notifyTripDispatched(populatedTrip));

    res.json({ success: true, data: trip });
});

// PATCH /trips/:id/complete
const completeTrip = asyncHandler(async (req, res) => {
    const trip = await Trip.findById(req.params.id);
    if (!trip) {
        return res.status(404).json({ success: false, message: "Trip not found" });
    }

    if (trip.status !== "DISPATCHED") {
        return res.status(400).json({ success: false, message: `Only DISPATCHED trips can be completed (current: ${trip.status})` });
    }

    const { actualDistance, fuelConsumed, finalOdometer } = req.body;

    if (actualDistance === undefined || fuelConsumed === undefined || finalOdometer === undefined) {
        return res.status(400).json({ success: false, message: "actualDistance, fuelConsumed, and finalOdometer are required" });
    }

    const vehicle = await Vehicle.findById(trip.vehicle);
    if (!vehicle) {
        return res.status(404).json({ success: false, message: "Vehicle not found" });
    }

    if (finalOdometer < vehicle.odometer) {
        return res.status(400).json({ success: false, message: `Final odometer (${finalOdometer}) cannot be less than current odometer (${vehicle.odometer})` });
    }

    const driver = await Driver.findById(trip.driver);

    trip.status = "COMPLETED";
    trip.actualDistance = actualDistance;
    trip.fuelConsumed = fuelConsumed;
    trip.completionTime = new Date();
    await trip.save();

    if (fuelConsumed > 0) {
        const FuelLog = (await import("../models/fuelLog.model.js")).default;
        await FuelLog.create({
            vehicle: vehicle._id,
            liters: fuelConsumed,
            cost: req.body.fuelCost || 0, 
            odometer: finalOdometer
        });
    }

    vehicle.status = "AVAILABLE";
    vehicle.odometer = finalOdometer;
    await vehicle.save();

    if (driver) {
        driver.status = "AVAILABLE";
        await driver.save();
    }

    const populatedTrip = await Trip.findById(trip._id).populate("vehicle driver");
    safeNotify(notifyTripCompleted(populatedTrip));

    res.json({ success: true, data: trip });
});

// PATCH /trips/:id/cancel
const cancelTrip = asyncHandler(async (req, res) => {
    const trip = await Trip.findById(req.params.id);
    if (!trip) {
        return res.status(404).json({ success: false, message: "Trip not found" });
    }

    if (trip.status !== "DISPATCHED") {
        return res.status(400).json({ success: false, message: "Only DISPATCHED trips can be cancelled" });
    }

    const vehicle = await Vehicle.findById(trip.vehicle);
    const driver = await Driver.findById(trip.driver);

    trip.status = "CANCELLED";
    await trip.save();

    if (vehicle) {
        vehicle.status = "AVAILABLE";
        await vehicle.save();
    }

    if (driver) {
        driver.status = "AVAILABLE";
        await driver.save();
    }

    const populatedTrip = await Trip.findById(trip._id).populate("vehicle driver");
    safeNotify(notifyTripCancelled(populatedTrip));

    res.json({ success: true, data: trip });
});

// PATCH /trips/:id/assign-driver
const assignDriver = asyncHandler(async (req, res) => {
    const trip = await Trip.findById(req.params.id);
    if (!trip) {
        return res.status(404).json({ success: false, message: "Trip not found" });
    }

    const { driverId } = req.body;
    if (!driverId) {
        return res.status(400).json({ success: false, message: "driverId is required" });
    }

    const newDriver = await Driver.findById(driverId);
    if (!newDriver) {
        return res.status(404).json({ success: false, message: "New driver not found" });
    }

    if (newDriver.status !== "AVAILABLE") {
        return res.status(400).json({ success: false, message: "New driver is not AVAILABLE" });
    }

    if (new Date(newDriver.licenseExpiry) < new Date()) {
        return res.status(400).json({ success: false, message: "New driver's license is expired" });
    }

    const oldDriverId = trip.driver;

    // If trip is DISPATCHED, handle status updates
    if (trip.status === "DISPATCHED") {
        const oldDriver = await Driver.findById(trip.driver);
        if (oldDriver) {
            oldDriver.status = "AVAILABLE";
            await oldDriver.save();
        }
        newDriver.status = "ON_TRIP";
        await newDriver.save();
    }

    trip.driver = driverId;
    await trip.save();

    const populatedTrip = await Trip.findById(trip._id).populate("vehicle driver");
    safeNotify(notifyDriverReassigned(populatedTrip, oldDriverId, newDriver));

    res.json({ success: true, data: trip });
});

// PATCH /trips/:id/assign-vehicle
const assignVehicle = asyncHandler(async (req, res) => {
    const trip = await Trip.findById(req.params.id);
    if (!trip) {
        return res.status(404).json({ success: false, message: "Trip not found" });
    }

    const { vehicleId } = req.body;
    if (!vehicleId) {
        return res.status(400).json({ success: false, message: "vehicleId is required" });
    }

    const newVehicle = await Vehicle.findById(vehicleId);
    if (!newVehicle) {
        return res.status(404).json({ success: false, message: "New vehicle not found" });
    }

    if (newVehicle.status !== "AVAILABLE") {
        return res.status(400).json({ success: false, message: "New vehicle is not AVAILABLE" });
    }

    if (trip.cargoWeight > newVehicle.maxLoadCapacity) {
        return res.status(400).json({ success: false, message: `Cargo weight exceeds new vehicle capacity` });
    }

    const oldVehicle = await Vehicle.findById(trip.vehicle);

    // If trip is DISPATCHED, handle status updates
    if (trip.status === "DISPATCHED") {
        if (oldVehicle) {
            oldVehicle.status = "AVAILABLE";
            await oldVehicle.save();
        }
        newVehicle.status = "ON_TRIP";
        await newVehicle.save();
    }

    trip.vehicle = vehicleId;
    await trip.save();

    const populatedTrip = await Trip.findById(trip._id).populate("vehicle driver");
    safeNotify(notifyVehicleChanged(populatedTrip, oldVehicle, newVehicle));

    res.json({ success: true, data: trip });
});

// GET /trips/active
const getActiveTrips = asyncHandler(async (_req, res) => {
    const trips = await Trip.find({ status: "DISPATCHED" }).populate("vehicle driver");
    res.json({ success: true, data: trips });
});

// GET /trips/drafts
const getDraftTrips = asyncHandler(async (_req, res) => {
    const trips = await Trip.find({ status: "DRAFT" }).populate("vehicle driver");
    res.json({ success: true, data: trips });
});

// GET /trips/completed
const getCompletedTrips = asyncHandler(async (_req, res) => {
    const trips = await Trip.find({ status: "COMPLETED" }).populate("vehicle driver");
    res.json({ success: true, data: trips });
});

// GET /trips/cancelled
const getCancelledTrips = asyncHandler(async (_req, res) => {
    const trips = await Trip.find({ status: "CANCELLED" }).populate("vehicle driver");
    res.json({ success: true, data: trips });
});

// GET /trips/driver/:driverId
const getTripsByDriver = asyncHandler(async (req, res) => {
    const trips = await Trip.find({ driver: req.params.driverId }).populate("vehicle driver");
    res.json({ success: true, data: trips });
});

// GET /trips/vehicle/:vehicleId
const getTripsByVehicle = asyncHandler(async (req, res) => {
    const trips = await Trip.find({ vehicle: req.params.vehicleId }).populate("vehicle driver");
    res.json({ success: true, data: trips });
});

// GET /trips/today
const getTodaysTrips = asyncHandler(async (_req, res) => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date();
    end.setHours(23, 59, 59, 999);

    const trips = await Trip.find({
        $or: [
            { dispatchTime: { $gte: start, $lte: end } },
            { createdAt: { $gte: start, $lte: end } },
        ],
    }).populate("vehicle driver");

    res.json({ success: true, data: trips });
});

export default {
    ...crud,
    list,
    create,
    update,
    dispatchTrip,
    completeTrip,
    cancelTrip,
    assignDriver,
    assignVehicle,
    getActiveTrips,
    getDraftTrips,
    getCompletedTrips,
    getCancelledTrips,
    getTripsByDriver,
    getTripsByVehicle,
    getTodaysTrips,
};
