import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    driver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Driver',
      required: true,
      index: true,
    },
    trip: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Trip',
      default: null,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ['INFO', 'SUCCESS', 'WARNING', 'ERROR', 'AI'],
      default: 'INFO',
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    actionUrl: {
      type: String,
      default: null,
      trim: true,
    },
    whatsappSent: {
      type: Boolean,
      default: false,
    },
    whatsappError: {
      type: String,
      default: null,
    },
    eventKey: {
      type: String,
      default: null,
      index: true,
    },
  },
  { timestamps: true }
);

notificationSchema.index({ driver: 1, createdAt: -1 });

const Notification = mongoose.model('Notification', notificationSchema);

export default Notification;
