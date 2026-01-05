// src/routes/v1/rack.route.js
const express = require('express');
const auth = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const rackValidation = require('../../validations/rack.validation');
const rackController = require('../../controllers/rack.controller');

const router = express.Router();

router
  .route('/')
  .post(auth('admin'), validate(rackValidation.createRack), rackController.createRack)
  .get(auth('admin', 'user'), validate(rackValidation.getRacks), rackController.getRacks);

router
  .route('/:rackId')
  .get(auth('admin', 'user'), validate(rackValidation.getRack), rackController.getRack)
  .patch(auth('admin'), validate(rackValidation.updateRack), rackController.updateRack)
  .delete(auth('admin'), validate(rackValidation.deleteRack), rackController.deleteRack);

module.exports = router;