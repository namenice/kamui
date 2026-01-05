// src/routes/v1/tenant.route.js
const express = require('express');
const auth = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const tenantValidation = require('../../validations/tenant.validation');
const tenantController = require('../../controllers/tenant.controller');

const router = express.Router();

router
  .route('/')
  .post(auth('admin'), validate(tenantValidation.createTenant), tenantController.createTenant)
  .get(auth('admin', 'user'), validate(tenantValidation.getTenants), tenantController.getTenants);

router
  .route('/:tenantId')
  .get(auth('admin', 'user'), validate(tenantValidation.getTenant), tenantController.getTenant)
  .patch(auth('admin'), validate(tenantValidation.updateTenant), tenantController.updateTenant)
  .delete(auth('admin'), validate(tenantValidation.deleteTenant), tenantController.deleteTenant);

module.exports = router;