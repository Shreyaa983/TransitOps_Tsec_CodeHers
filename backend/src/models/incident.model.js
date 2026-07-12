import mongoose from 'mongoose';

const aiAnalysisSchema = new mongoose.Schema({
  category: { type: String, required: true },
  subcategory: { type: String, required: true },
  severity: { type: String, required: true },
  summary: { type: String, required: true },
  recommendedAction: { type: String, required: true },
  estimatedDowntime: { type: String, required: true },
  likelyParts: [{ type: String }],
  confidence: { type: Number, required: true },
  dispatchAllowed: { type: Boolean, required: true },
  requiresImmediateStop: { type: Boolean, required: true }
}, { _id: false });

const incidentSchema = new mongoose.Schema(
  {
    driver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Driver',
      required: true,
    },
    vehicle: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vehicle',
      required: true,
    },
    observation: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['PENDING', 'APPROVED', 'REJECTED', 'RESOLVED'],
      default: 'PENDING',
    },
    aiAnalysis: aiAnalysisSchema,
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    reviewedAt: {
      type: Date,
    },
    maintenanceLog: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MaintenanceLog',
    },
  },
  { timestamps: true }
);

export default mongoose.model('Incident', incidentSchema);
