// src/validations/zone.validation.js
const Joi = require('joi');

const createZone = {
  body: Joi.object().keys({
    name: Joi.string().required(),
    description: Joi.string().allow('').optional(),
    regionId: Joi.string().uuid().required(), // จำเป็นต้องระบุว่าอยู่ภาคไหน
  }),
};

const getZones = {
  query: Joi.object().keys({
    name: Joi.string(),
    search: Joi.string(), 
    regionId: Joi.string().uuid(),
    sortBy: Joi.string(),
    sortOrder: Joi.string().valid('asc', 'desc'), 
    limit: Joi.number().integer(),
    page: Joi.number().integer(),
  }),
};

const getZone = {
  params: Joi.object().keys({
    zoneId: Joi.string().uuid().required(),
  }),
};

const updateZone = {
  params: Joi.object().keys({
    zoneId: Joi.string().uuid().required(),
  }),
  body: Joi.object()
    .keys({
      name: Joi.string(),
      description: Joi.string().allow('').optional(),
      regionId: Joi.string().uuid(), // เผื่อย้ายภาค
    })
    .min(1),
};

const deleteZone = {
  params: Joi.object().keys({
    zoneId: Joi.string().uuid().required(),
  }),
};

module.exports = {
  createZone,
  getZones,
  getZone,
  updateZone,
  deleteZone,
};