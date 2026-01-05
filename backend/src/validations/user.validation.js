// src/validations.user.validation.js

const Joi = require('joi');
const { password } = require('./custom.validation');

const createUser = {
  body: Joi.object().keys({
    email: Joi.string().required().email(),
    password: Joi.string().required().custom(password),
    firstName: Joi.string().required(),
    lastName: Joi.string().required(),
    role: Joi.string().required().valid('user', 'admin'), // บังคับว่าต้องเป็น user หรือ admin เท่านั้น
    status: Joi.string().required().valid('active', 'pending', 'banned'),
  }),
};

const getUsers = {
  query: Joi.object().keys({
    search: Joi.string(),
    role: Joi.string(),
    sortBy: Joi.string(),
    sortOrder: Joi.string().valid('asc', 'desc'),
    limit: Joi.number().integer(),
    page: Joi.number().integer(),
  }),
};

const getUser = {
  params: Joi.object().keys({
    userId: Joi.string().uuid().required(), // บังคับว่าต้องเป็น UUID
  }),
};

const updateUser = {
  params: Joi.object().keys({
    userId: Joi.string().uuid().required(),
  }),
  body: Joi.object()
    .keys({
      email: Joi.string().email(),
      password: Joi.string().custom(password),
      firstName: Joi.string(),
      lastName: Joi.string(),
      role: Joi.string().required().valid('user', 'admin'),
      status: Joi.string().required().valid('active', 'pending', 'banned'),
    })
    .min(1), // บังคับว่าต้องส่งมาอย่างน้อย 1 field เพื่อแก้
};

const deleteUser = {
  params: Joi.object().keys({
    userId: Joi.string().uuid().required(),
  }),
};

module.exports = {
  createUser,
  getUsers,
  getUser,
  updateUser,
  deleteUser,
};