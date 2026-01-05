// src/validations/hardwareType.validation.js
const Joi = require('joi');

const createHardwareType = {
  body: Joi.object().keys({
    name: Joi.string().required(),
    category: Joi.string().allow('').optional(),
    description: Joi.string().allow('').optional(),
  }),
};

const getHardwareTypes = {
  query: Joi.object().keys({
    name: Joi.string(),
    category: Joi.string(),
    search: Joi.string(),
    sortBy: Joi.string(),
    sortOrder: Joi.string().valid('asc', 'desc'),
    limit: Joi.number().integer(),
    page: Joi.number().integer(),
  }),
};

const getHardwareType = {
  params: Joi.object().keys({
    typeId: Joi.string().uuid().required(),
  }),
};

const updateHardwareType = {
  params: Joi.object().keys({
    typeId: Joi.string().uuid().required(),
  }),
  body: Joi.object()
    .keys({
      name: Joi.string(),
      category: Joi.string().allow('').optional(),
      description: Joi.string().allow('').optional(),
    })
    .min(1),
};

const deleteHardwareType = {
  params: Joi.object().keys({
    typeId: Joi.string().uuid().required(),
  }),
};

module.exports = {
  createHardwareType,
  getHardwareTypes,
  getHardwareType,
  updateHardwareType,
  deleteHardwareType,
};