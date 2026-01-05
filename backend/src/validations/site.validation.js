// src/validations/site.validation.js
const Joi = require('joi');

const createSite = {
  body: Joi.object().keys({
    name: Joi.string().required(),
    description: Joi.string().allow('').optional(),
    zoneId: Joi.string().uuid().required(), // ต้องระบุว่าอยู่ Zone ไหน
  }),
};

const getSites = {
  query: Joi.object().keys({
    name: Joi.string(),
    zoneId: Joi.string().uuid(), // เผื่อค้นหา Site ทั้งหมดใน Zone นี้
    search: Joi.string(),
    sortBy: Joi.string(),
    sortOrder: Joi.string().valid('asc', 'desc'),
    limit: Joi.number().integer(),
    page: Joi.number().integer(),
  }),
};

const getSite = {
  params: Joi.object().keys({
    siteId: Joi.string().uuid().required(),
  }),
};

const updateSite = {
  params: Joi.object().keys({
    siteId: Joi.string().uuid().required(),
  }),
  body: Joi.object()
    .keys({
      name: Joi.string(),
      description: Joi.string().allow('').optional(),
      zoneId: Joi.string().uuid(), // เผื่อย้าย Zone
    })
    .min(1),
};

const deleteSite = {
  params: Joi.object().keys({
    siteId: Joi.string().uuid().required(),
  }),
};

module.exports = {
  createSite,
  getSites,
  getSite,
  updateSite,
  deleteSite,
};