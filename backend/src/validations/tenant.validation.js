// src/validations/tenant.validation.js
const Joi = require('joi');

const createTenant = {
  body: Joi.object().keys({
    name: Joi.string().required(),
    description: Joi.string().allow('').optional(),
    tenantGroupId: Joi.string().uuid().required(), // ต้องระบุกลุ่ม
  }),
};

const getTenants = {
  query: Joi.object().keys({
    name: Joi.string(),
    search: Joi.string(),
    tenantGroupId: Joi.string().uuid(),
    sortBy: Joi.string(),
    sortOrder: Joi.string().valid('asc', 'desc'),
    limit: Joi.number().integer(),
    page: Joi.number().integer(),
  }),
};

const getTenant = {
  params: Joi.object().keys({
    tenantId: Joi.string().uuid().required(),
  }),
};

const updateTenant = {
  params: Joi.object().keys({
    tenantId: Joi.string().uuid().required(),
  }),
  body: Joi.object()
    .keys({
      name: Joi.string(),
      description: Joi.string().allow('').optional(),
      tenantGroupId: Joi.string().uuid(),
    })
    .min(1),
};

const deleteTenant = {
  params: Joi.object().keys({
    tenantId: Joi.string().uuid().required(),
  }),
};

module.exports = {
  createTenant,
  getTenants,
  getTenant,
  updateTenant,
  deleteTenant,
};