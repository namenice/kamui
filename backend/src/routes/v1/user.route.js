// src/routes/v1/user.route.js
const express = require('express');
const auth = require('../../middlewares/auth');
const userController = require('../../controllers/user.controller');
const validate = require('../../middlewares/validate');
const userValidation = require('../../validations/user.validation');

const router = express.Router();

router
  .route('/')
  .post(auth('admin'), validate(userValidation.createUser), userController.createUser)  // POST /api/v1/users
  .get(auth('admin', 'user'), validate(userValidation.getUsers), userController.getUsers); // GET  /api/v1/users (รองรับ ?search=...)

router
  .route('/:userId')
  .get(auth('admin', 'user'), validate(userValidation.getUser), userController.getUser) // GET    /api/v1/users/:userId
  .patch(auth('admin'), validate(userValidation.updateUser), userController.updateUser) // PATCH  /api/v1/users/:userId
  .delete(auth('admin'), validate(userValidation.deleteUser), userController.deleteUser); // DELETE /api/v1/users/:userId

module.exports = router;