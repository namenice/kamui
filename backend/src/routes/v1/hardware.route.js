// src/routes/v1/hardware.route.js
const express = require('express');
const auth = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const hardwareValidation = require('../../validations/hardware.validation');
const hardwareController = require('../../controllers/hardware.controller');

const router = express.Router();

router.route('/')
  .post(auth('admin'), validate(hardwareValidation.createHardware), hardwareController.createHardware)
  .get(auth('admin', 'user'), validate(hardwareValidation.getHardwares), hardwareController.getHardwares);

router.route('/:hardwareId')
  .get(auth('admin', 'user'), validate(hardwareValidation.getHardware), hardwareController.getHardware)
  .patch(auth('admin'), validate(hardwareValidation.updateHardware), hardwareController.updateHardware)
  .delete(auth('admin'), validate(hardwareValidation.deleteHardware), hardwareController.deleteHardware);

module.exports = router;