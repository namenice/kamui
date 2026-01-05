// src/validations/hardwareInfo.validation.js
const Joi = require('joi');

const createHardwareInfo = {
  body: Joi.object().keys({
    manufacturer: Joi.string().required(),
    model: Joi.string().required(),
    height: Joi.number().integer().min(1).default(1),
    hardwareTypeId: Joi.string().uuid().required(),
  }),
};

const getHardwareInfos = {
  query: Joi.object().keys({
    manufacturer: Joi.string(),
    model: Joi.string(),
    hardwareTypeId: Joi.string().uuid(),
    search: Joi.string(), // Global Search
    sortBy: Joi.string(),
    sortOrder: Joi.string().valid('asc', 'desc'),
    limit: Joi.number().integer(),
    page: Joi.number().integer(),
  }),
};

const getHardwareInfo = {
  params: Joi.object().keys({
    infoId: Joi.string().uuid().required(),
  }),
};

const updateHardwareInfo = {
  params: Joi.object().keys({
    infoId: Joi.string().uuid().required(),
  }),
  body: Joi.object()
    .keys({
      manufacturer: Joi.string(),
      model: Joi.string(),
      height: Joi.number().integer().min(1),
      hardwareTypeId: Joi.string().uuid(),
    })
    .min(1),
};

const deleteHardwareInfo = {
  params: Joi.object().keys({
    infoId: Joi.string().uuid().required(),
  }),
};

module.exports = {
  createHardwareInfo,
  getHardwareInfos,
  getHardwareInfo,
  updateHardwareInfo,
  deleteHardwareInfo,
};