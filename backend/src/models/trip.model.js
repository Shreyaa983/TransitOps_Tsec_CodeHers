import mongoose from 'mongoose';

const tripSchema = new mongoose.Schema(
  {
    vehicle: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vehicle',
      required: true,
    },
    driver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Driver',
      required: true,
    },
    source: {
      type: String,
      required: true,
      trim: true,
    },
    destination: {
      type: String,
      required: true,
      trim: true,
    },
    cargoWeight: {
      type: Number,
      required: true,
      min: 0,
    },
    plannedDistance: {
      type: Number,
      required: true,
      min: 0,
    },
    actualDistance: {
      type: Number,
      default: 0,
      min: 0,
    },
    fuelConsumed: {
      type: Number,
      default: 0,
      min: 0,
    },
    status: {
      type: String,
      enum: ['DRAFT', 'DISPATCHED', 'COMPLETED', 'CANCELLED'],
      default: 'DRAFT',
    },
    scheduledStartTime: {
      type: Date,
      default: null,
    },
    dispatchTime: {
      type: Date,
      default: null,
    },
    completionTime: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

const Trip = mongoose.model('Trip', tripSchema);

export default Trip;