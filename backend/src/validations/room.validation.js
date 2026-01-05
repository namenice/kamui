// src/validations/room.validation.js
const Joi = require('joi');

const createRoom = {
  body: Joi.object().keys({
    name: Joi.string().required(),
    description: Joi.string().allow('').optional(),
    siteId: Joi.string().uuid().required(), // ต้องระบุว่าอยู่ตึกไหน
  }),
};

const getRooms = {
  query: Joi.object().keys({
    name: Joi.string(),
    siteId: Joi.string().uuid(), // กรองหาห้องเฉพาะในตึกนี้
    search: Joi.string(),
    sortBy: Joi.string(),
    sortOrder: Joi.string().valid('asc', 'desc'),
    limit: Joi.number().integer(),
    page: Joi.number().integer(),
  }),
};

const getRoom = {
  params: Joi.object().keys({
    roomId: Joi.string().uuid().required(),
  }),
};

const updateRoom = {
  params: Joi.object().keys({
    roomId: Joi.string().uuid().required(),
  }),
  body: Joi.object()
    .keys({
      name: Joi.string(),
      description: Joi.string().allow('').optional(),
      siteId: Joi.string().uuid(), // เผื่อย้ายตึก
    })
    .min(1),
};

const deleteRoom = {
  params: Joi.object().keys({
    roomId: Joi.string().uuid().required(),
  }),
};

module.exports = {
  createRoom,
  getRooms,
  getRoom,
  updateRoom,
  deleteRoom,
};