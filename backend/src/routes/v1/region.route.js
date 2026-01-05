// src/routes/v1/region.route.js
const express = require('express');
const auth = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const regionValidation = require('../../validations/region.validation');
const regionController = require('../../controllers/region.controller');

const router = express.Router();

router
  .route('/')
  // create: ต้องเป็น admin เท่านั้น
  .post(auth('admin'), validate(regionValidation.createRegion), regionController.createRegion)
  // get all: user ทั่วไปดูได้
  .get(auth('admin', 'user'), validate(regionValidation.getRegions), regionController.getRegions);

router
  .route('/:regionId')
  // get one: user ทั่วไปดูได้
  .get(auth('admin', 'user'), validate(regionValidation.getRegion), regionController.getRegion)
  // update: ต้องเป็น admin
  .patch(auth('admin'), validate(regionValidation.updateRegion), regionController.updateRegion)
  // delete: ต้องเป็น admin
  .delete(auth('admin'), validate(regionValidation.deleteRegion), regionController.deleteRegion);

module.exports = router;