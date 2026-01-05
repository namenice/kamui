// src/validations/interfaceConnection.validation.js
const Joi = require('joi');

const createConnection = {
  body: Joi.object().keys({
    name: Joi.string().required(),
    macAddress: Joi.string().allow('').optional(),
    ipAddress: Joi.string().ip().allow('').optional(),
    speed: Joi.string().allow('').optional(),
    type: Joi.string().allow('').optional(),
    
    hardwareId: Joi.string().uuid().required(), // เจ้าของ Port
    connectedSwitchId: Joi.string().uuid().allow(null).optional(), // ปลายทาง (Switch)
    connectedPort: Joi.string().allow('').optional(), // ปลายทาง (Port)
  }),
};

const getConnections = {
  query: Joi.object().keys({
    hardwareId: Joi.string().uuid(),
    connectedSwitchId: Joi.string().uuid(),
    search: Joi.string(),
    sortBy: Joi.string(),
    sortOrder: Joi.string().valid('asc', 'desc'),
    limit: Joi.number().integer(),
    page: Joi.number().integer(),
  }),
};

const getConnection = {
  params: Joi.object().keys({
    connectionId: Joi.string().uuid().required(),
  }),
};

const updateConnection = {
  params: Joi.object().keys({
    connectionId: Joi.string().uuid().required(),
  }),
  body: Joi.object()
    .keys({
      name: Joi.string(),
      macAddress: Joi.string().allow('').optional(),
      ipAddress: Joi.string().ip().allow('').optional(),
      speed: Joi.string().allow('').optional(),
      type: Joi.string().allow('').optional(),
      hardwareId: Joi.string().uuid(),
      connectedSwitchId: Joi.string().uuid().allow(null),
      connectedPort: Joi.string().allow('').optional(),
    })
    .min(1),
};

const deleteConnection = {
  params: Joi.object().keys({
    connectionId: Joi.string().uuid().required(),
  }),
};

module.exports = {
  createConnection,
  getConnections,
  getConnection,
  updateConnection,
  deleteConnection,
};