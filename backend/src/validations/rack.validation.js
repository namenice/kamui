// src/validations/rack.validation.js
const Joi = require('joi');

const createRack = {
  body: Joi.object().keys({
    name: Joi.string().required(),
    description: Joi.string().allow('').optional(),
    unit: Joi.number().integer().min(1).default(42), // ความสูงตู้ (เช่น 42)
    roomId: Joi.string().uuid().required(), // ต้องระบุว่าอยู่ห้องไหน
  }),
};

const getRacks = {
  query: Joi.object().keys({
    name: Joi.string(),
    roomId: Joi.string().uuid(), // กรองหาตู้เฉพาะในห้องนี้
    search: Joi.string(), 
    sortBy: Joi.string(),
    sortOrder: Joi.string().valid('asc', 'desc'),
    limit: Joi.number().integer(),
    page: Joi.number().integer(),
  }),
};

const getRack = {
  params: Joi.object().keys({
    rackId: Joi.string().uuid().required(),
  }),
};

const updateRack = {
  params: Joi.object().keys({
    rackId: Joi.string().uuid().required(),
  }),
  body: Joi.object()
    .keys({
      name: Joi.string(),
      description: Joi.string().allow('').optional(),
      unit: Joi.number().integer().min(1),
      roomId: Joi.string().uuid(), // เผื่อย้ายห้อง
    })
    .min(1),
};

const deleteRack = {
  params: Joi.object().keys({
    rackId: Joi.string().uuid().required(),
  }),
};

module.exports = {
  createRack,
  getRacks,
  getRack,
  updateRack,
  deleteRack,
};