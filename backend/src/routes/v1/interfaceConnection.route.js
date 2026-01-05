// src/routes/v1/interfaceConnection.route.js
const express = require('express');
const auth = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const connectionValidation = require('../../validations/interfaceConnection.validation');
const connectionController = require('../../controllers/interfaceConnection.controller');

const router = express.Router();

router.route('/')
  .post(auth('admin'), validate(connectionValidation.createConnection), connectionController.createConnection)
  .get(auth('admin', 'user'), validate(connectionValidation.getConnections), connectionController.getConnections);

router.route('/:connectionId')
  .get(auth('admin', 'user'), validate(connectionValidation.getConnection), connectionController.getConnection)
  .patch(auth('admin'), validate(connectionValidation.updateConnection), connectionController.updateConnection)
  .delete(auth('admin'), validate(connectionValidation.deleteConnection), connectionController.deleteConnection);

module.exports = router;