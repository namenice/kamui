// src/validations/tenantGroup.validation.js
const Joi = require('joi');

const createTenantGroup = {
  body: Joi.object().keys({
    name: Joi.string().required(),
    description: Joi.string().allow('').optional(),
  }),
};

const getTenantGroups = {
  query: Joi.object().keys({
    name: Joi.string(),
    search: Joi.string(),
    sortBy: Joi.string(),
    sortOrder: Joi.string().valid('asc', 'desc'),
    limit: Joi.number().integer(),
    page: Joi.number().integer(),
  }),
};

const getTenantGroup = {
  params: Joi.object().keys({
    groupId: Joi.string().uuid().required(),
  }),
};

const updateTenantGroup = {
  params: Joi.object().keys({
    groupId: Joi.string().uuid().required(),
  }),
  body: Joi.object()
    .keys({
      name: Joi.string(),
      description: Joi.string().allow('').optional(),
    })
    .min(1),
};

const deleteTenantGroup = {
  params: Joi.object().keys({
    groupId: Joi.string().uuid().required(),
  }),
};

module.exports = {
  createTenantGroup,
  getTenantGroups,
  getTenantGroup,
  updateTenantGroup,
  deleteTenantGroup,
};