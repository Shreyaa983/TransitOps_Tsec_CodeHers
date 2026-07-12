import { body } from 'express-validator';

const requiredText = (field) => body(field).trim().notEmpty().withMessage(`${field} is required`);
const optionalText = (field) => body(field).optional({ checkFalsy: true }).trim().notEmpty().withMessage(`${field} cannot be empty`);
const requiredNumber = (field) => body(field).isNumeric().withMessage(`${field} must be a number`);
const optionalNumber = (field) => body(field).optional({ checkFalsy: true }).isNumeric().withMessage(`${field} must be a number`);
const requiredDate = (field) => body(field).isISO8601().toDate().withMessage(`${field} must be a valid date`);
const optionalDate = (field) => body(field).optional({ checkFalsy: true }).isISO8601().toDate().withMessage(`${field} must be a valid date`);

export const registerValidators = [
  requiredText('name'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  body('role').isIn(['FLEET_MANAGER', 'DISPATCHER', 'SAFETY_OFFICER', 'FINANCIAL_ANALYST', 'DRIVER']).withMessage('Invalid role'),
  body('driver').optional({ checkFalsy: true }).isMongoId().withMessage('driver must be a valid id'),
];

export const loginValidators = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required'),
];

export const userCreateValidators = [
  requiredText('name'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  body('role').isIn(['FLEET_MANAGER', 'DISPATCHER', 'SAFETY_OFFICER', 'FINANCIAL_ANALYST', 'DRIVER']).withMessage('Invalid role'),
  body('driver').optional({ checkFalsy: true }).isMongoId().withMessage('driver must be a valid id'),
];

export const userUpdateValidators = [
  optionalText('name'),
  body('email').optional({ checkFalsy: true }).isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').optional({ checkFalsy: true }).isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  body('role').optional({ checkFalsy: true }).isIn(['FLEET_MANAGER', 'DISPATCHER', 'SAFETY_OFFICER', 'FINANCIAL_ANALYST', 'DRIVER']).withMessage('Invalid role'),
  body('driver').optional({ checkFalsy: true }).isMongoId().withMessage('driver must be a valid id'),
];

export const vehicleCreateValidators = [
  requiredText('registrationNumber'),
  requiredText('name'),
  requiredText('model'),
  body('type').trim().notEmpty().withMessage('type is required'),
  requiredNumber('maxLoadCapacity'),
  requiredNumber('odometer'),
  requiredNumber('acquisitionCost'),
  body('status').optional().isIn(['AVAILABLE', 'ON_TRIP', 'IN_SHOP', 'RETIRED']).withMessage('Invalid status'),
];

export const vehicleUpdateValidators = [
  optionalText('registrationNumber'),
  optionalText('name'),
  optionalText('model'),
  body('type').optional({ checkFalsy: true }).trim().notEmpty().withMessage('type cannot be empty'),
  optionalNumber('maxLoadCapacity'),
  optionalNumber('odometer'),
  optionalNumber('acquisitionCost'),
  body('status').optional().isIn(['AVAILABLE', 'ON_TRIP', 'IN_SHOP', 'RETIRED']).withMessage('Invalid status'),
];

export const driverCreateValidators = [
  requiredText('name'),
  requiredText('licenseNumber'),
  requiredText('licenseCategory'),
  requiredDate('licenseExpiry'),
  requiredText('phone'),
  body('safetyScore').optional().isNumeric().withMessage('safetyScore must be a number'),
  body('status').optional().isIn(['AVAILABLE', 'ON_TRIP', 'OFF_DUTY', 'SUSPENDED']).withMessage('Invalid status'),
  body('user').optional({ checkFalsy: true }).isMongoId().withMessage('user must be a valid id'),
];

export const driverUpdateValidators = [
  optionalText('name'),
  optionalText('licenseNumber'),
  optionalText('licenseCategory'),
  optionalDate('licenseExpiry'),
  optionalText('phone'),
  optionalNumber('safetyScore'),
  body('status').optional().isIn(['AVAILABLE', 'ON_TRIP', 'OFF_DUTY', 'SUSPENDED']).withMessage('Invalid status'),
  body('user').optional({ checkFalsy: true }).isMongoId().withMessage('user must be a valid id'),
];

export const tripCreateValidators = [
  body('vehicle').isMongoId().withMessage('vehicle must be a valid id'),
  body('driver').isMongoId().withMessage('driver must be a valid id'),
  requiredText('source'),
  requiredText('destination'),
  requiredNumber('cargoWeight'),
  requiredNumber('plannedDistance'),
  body('actualDistance').optional().isNumeric().withMessage('actualDistance must be a number'),
  body('fuelConsumed').optional().isNumeric().withMessage('fuelConsumed must be a number'),
  body('status').optional().isIn(['DRAFT', 'DISPATCHED', 'COMPLETED', 'CANCELLED']).withMessage('Invalid status'),
  optionalDate('dispatchTime'),
  optionalDate('completionTime'),
];

export const tripUpdateValidators = [
  body('vehicle').optional().isMongoId().withMessage('vehicle must be a valid id'),
  body('driver').optional().isMongoId().withMessage('driver must be a valid id'),
  optionalText('source'),
  optionalText('destination'),
  optionalNumber('cargoWeight'),
  optionalNumber('plannedDistance'),
  optionalNumber('actualDistance'),
  optionalNumber('fuelConsumed'),
  body('status').optional().isIn(['DRAFT', 'DISPATCHED', 'COMPLETED', 'CANCELLED']).withMessage('Invalid status'),
  optionalDate('dispatchTime'),
  optionalDate('completionTime'),
];

export const maintenanceCreateValidators = [
  body('vehicle').isMongoId().withMessage('vehicle must be a valid id'),
  requiredText('issue'),
  requiredText('description'),
  requiredText('technician'),
  requiredNumber('cost'),
  body('status').optional().isIn(['OPEN', 'CLOSED']).withMessage('Invalid status'),
  optionalDate('openedAt'),
  optionalDate('closedAt'),
];

export const maintenanceUpdateValidators = [
  body('vehicle').optional().isMongoId().withMessage('vehicle must be a valid id'),
  optionalText('issue'),
  optionalText('description'),
  optionalText('technician'),
  optionalNumber('cost'),
  body('status').optional().isIn(['OPEN', 'CLOSED']).withMessage('Invalid status'),
  optionalDate('openedAt'),
  optionalDate('closedAt'),
];

export const fuelCreateValidators = [
  body('vehicle').isMongoId().withMessage('vehicle must be a valid id'),
  requiredNumber('liters'),
  requiredNumber('cost'),
  requiredNumber('odometer'),
  optionalDate('date'),
];

export const fuelUpdateValidators = [
  body('vehicle').optional().isMongoId().withMessage('vehicle must be a valid id'),
  optionalNumber('liters'),
  optionalNumber('cost'),
  optionalNumber('odometer'),
  optionalDate('date'),
];

export const expenseCreateValidators = [
  body('vehicle').isMongoId().withMessage('vehicle must be a valid id'),
  body('trip').optional({ checkFalsy: true }).isMongoId().withMessage('trip must be a valid id'),
  body('category').isIn(['FUEL', 'MAINTENANCE', 'TOLL', 'INSURANCE', 'OTHER']).withMessage('Invalid category'),
  requiredNumber('amount'),
  requiredText('description'),
  optionalDate('date'),
];

export const expenseUpdateValidators = [
  body('vehicle').optional().isMongoId().withMessage('vehicle must be a valid id'),
  body('trip').optional({ checkFalsy: true }).isMongoId().withMessage('trip must be a valid id'),
  body('category').optional().isIn(['FUEL', 'MAINTENANCE', 'TOLL', 'INSURANCE', 'OTHER']).withMessage('Invalid category'),
  optionalNumber('amount'),
  optionalText('description'),
  optionalDate('date'),
];

export const incidentCreateValidators = [
  body('driver').isMongoId().withMessage('driver must be a valid id'),
  body('vehicle').isMongoId().withMessage('vehicle must be a valid id'),
  requiredText('observation'),
  body('status').optional().isIn(['PENDING', 'APPROVED', 'REJECTED', 'RESOLVED']).withMessage('Invalid status')
];

export const incidentUpdateValidators = [
  body('driver').optional().isMongoId().withMessage('driver must be a valid id'),
  body('vehicle').optional().isMongoId().withMessage('vehicle must be a valid id'),
  optionalText('observation'),
  body('status').optional().isIn(['PENDING', 'APPROVED', 'REJECTED', 'RESOLVED']).withMessage('Invalid status')
];