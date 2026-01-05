// src/routes/v1/zone.route.js
const express = require('express');
const auth = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const zoneValidation = require('../../validations/zone.validation');
const zoneController = require('../../controllers/zone.controller');

const router = express.Router();

router
  .route('/')
  .post(auth('admin'), validate(zoneValidation.createZone), zoneController.createZone)
  .get(auth('admin', 'user'), validate(zoneValidation.getZones), zoneController.getZones);

router
  .route('/:zoneId')
  .get(auth('admin', 'user'), validate(zoneValidation.getZone), zoneController.getZone)
  .patch(auth('admin'), validate(zoneValidation.updateZone), zoneController.updateZone)
  .delete(auth('admin'), validate(zoneValidation.deleteZone), zoneController.deleteZone);

module.exports = router;