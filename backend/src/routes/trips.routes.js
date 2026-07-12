import { Router } from "express";
import tripController from "../controllers/trips.controller.js";
import { createResourceRouter } from "./resource-router.js";
import { tripCreateValidators, tripUpdateValidators } from "../validators/index.js";
import { protect } from "../middleware/authMiddleware.js";

const router = Router();

// Protect all trip routes
router.use(protect);

// --- Custom Query Routes ---
router.get("/active", tripController.getActiveTrips);
router.get("/drafts", tripController.getDraftTrips);
router.get("/completed", tripController.getCompletedTrips);
router.get("/cancelled", tripController.getCancelledTrips);
router.get("/today", tripController.getTodaysTrips);
router.get("/driver/:driverId", tripController.getTripsByDriver);
router.get("/vehicle/:vehicleId", tripController.getTripsByVehicle);

// --- Custom Action Routes ---
router.patch("/:id/dispatch", tripController.dispatchTrip);
router.patch("/:id/complete", tripController.completeTrip);
router.patch("/:id/cancel", tripController.cancelTrip);
router.patch("/:id/assign-driver", tripController.assignDriver);
router.patch("/:id/assign-vehicle", tripController.assignVehicle);

// --- Generic CRUD Fallback ---
router.use(
    createResourceRouter({
        controller: tripController,
        createValidators: tripCreateValidators,
        updateValidators: tripUpdateValidators,
    })
);

export default router;