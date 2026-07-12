import bcrypt from 'bcrypt';
import { ApiError } from '../utils/apiError.js';

const hashUserPasswordIfNeeded = async (model, payload) => {
  if (model.modelName === 'User' && payload.password) {
    payload.password = await bcrypt.hash(payload.password, 12);
  }

  return payload;
};

export const createCrudService = (model) => ({
  async list() {
    return model.find().sort({ createdAt: -1 });
  },

  async getById(id) {
    const document = await model.findById(id);

    if (!document) {
      throw new ApiError(404, `${model.modelName} not found`);
    }

    return document;
  },

  async create(payload) {
    return model.create(payload);
  },

  async update(id, payload) {
    const nextPayload = await hashUserPasswordIfNeeded(model, { ...payload });
    const updatedDocument = await model.findByIdAndUpdate(id, nextPayload, {
      new: true,
      runValidators: true,
    });

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