// src/validations/region.validation.js
const Joi = require('joi');

const createRegion = {
  body: Joi.object().keys({
    name: Joi.string().required(),
    description: Joi.string().allow('').optional(), // ส่ง empty string ได้ หรือไม่ส่งก็ได้
  }),
};

const getRegions = {
  query: Joi.object().keys({
    name: Joi.string(),
    search: Joi.string(),
    sortBy: Joi.string(),
    sortOrder: Joi.string().valid('asc', 'desc'),
    limit: Joi.number().integer(),
    page: Joi.number().integer(),
  }),
};

const getRegion = {
  params: Joi.object().keys({
    regionId: Joi.string().uuid().required(), // เช็คว่าเป็น UUID format
  }),
};

const updateRegion = {
  params: Joi.object().keys({
    regionId: Joi.string().uuid().required(),
  }),
  body: Joi.object()
    .keys({
      name: Joi.string(),
      description: Joi.string().allow('').optional(),
    })
    .min(1), // ต้องส่งมาอย่างน้อย 1 field ถ้าจะ update
};

const deleteRegion = {
  params: Joi.object().keys({
    regionId: Joi.string().uuid().required(),
  }),
};

module.exports = {
  createRegion,
  getRegions,
  getRegion,
  updateRegion,
  deleteRegion,
};