// src/routes/v1/hardwareType.route.js
const express = require('express');
const auth = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const hardwareTypeValidation = require('../../validations/hardwareType.validation');
const hardwareTypeController = require('../../controllers/hardwareType.controller');

const router = express.Router();

router.route('/')
  .post(auth('admin'), validate(hardwareTypeValidation.createHardwareType), hardwareTypeController.createHardwareType)
  .get(auth('admin', 'user'), validate(hardwareTypeValidation.getHardwareTypes), hardwareTypeController.getHardwareTypes);

router.route('/:typeId')
  .get(auth('admin', 'user'), validate(hardwareTypeValidation.getHardwareType), hardwareTypeController.getHardwareType)
  .patch(auth('admin'), validate(hardwareTypeValidation.updateHardwareType), hardwareTypeController.updateHardwareType)
  .delete(auth('admin'), validate(hardwareTypeValidation.deleteHardwareType), hardwareTypeController.deleteHardwareType);

module.exports = router;