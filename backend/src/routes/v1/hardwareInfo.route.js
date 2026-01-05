// src/routes/v1/hardwareInfo.route.js
const express = require('express');
const auth = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const hardwareInfoValidation = require('../../validations/hardwareInfo.validation');
const hardwareInfoController = require('../../controllers/hardwareInfo.controller');

const router = express.Router();

router
  .route('/')
  .post(auth('admin'), validate(hardwareInfoValidation.createHardwareInfo), hardwareInfoController.createHardwareInfo)
  .get(auth('admin', 'user'), validate(hardwareInfoValidation.getHardwareInfos), hardwareInfoController.getHardwareInfos);

router
  .route('/:infoId')
  .get(auth('admin', 'user'), validate(hardwareInfoValidation.getHardwareInfo), hardwareInfoController.getHardwareInfo)
  .patch(auth('admin'), validate(hardwareInfoValidation.updateHardwareInfo), hardwareInfoController.updateHardwareInfo)
  .delete(auth('admin'), validate(hardwareInfoValidation.deleteHardwareInfo), hardwareInfoController.deleteHardwareInfo);

module.exports = router;