import bcrypt from 'bcrypt';
import { ApiError } from '../utils/apiError.js';

const hashUserPasswordIfNeeded = async (model, payload) => {
  if (model.modelName === 'User' && payload.password) {
    payload.password = await bcrypt.hash(payload.password, 12);
  }

  return payload;
};

const applyPopulations = (query, modelName) => {
  if (modelName === 'User') {
    return query.select('-password').populate('driver');
  }
  if (modelName === 'Driver') {
    return query.populate('user');
  }
  if (modelName === 'Trip') {
    return query.populate('vehicle driver');
  }
  return query;
};

export const createCrudService = (model) => ({
  async list() {
    return applyPopulations(model.find(), model.modelName).sort({ createdAt: -1 });
  },

  async getById(id) {
    const document = await applyPopulations(model.findById(id), model.modelName);

    if (!document) {
      throw new ApiError(404, `${model.modelName} not found`);
    }

    return document;
  },

  async create(payload) {
    const created = await model.create(payload);
    return applyPopulations(model.findById(created._id), model.modelName);
  },

  async update(id, payload) {
    const nextPayload = await hashUserPasswordIfNeeded(model, { ...payload });
    const updatedDocument = await applyPopulations(
      model.findByIdAndUpdate(id, nextPayload, {
        new: true,
        runValidators: true,
      }),
      model.modelName
    );

    if (!updatedDocument) {
      throw new ApiError(404, `${model.modelName} not found`);
    }

    return updatedDocument;
  },

  async remove(id) {
    const deletedDocument = await model.findByIdAndDelete(id);

    if (!deletedDocument) {
      throw new ApiError(404, `${model.modelName} not found`);
    }

    return deletedDocument;
  },
});