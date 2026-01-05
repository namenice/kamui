// src/routes/v1/tenantGroup.route.js
const express = require('express');
const auth = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const tenantGroupValidation = require('../../validations/tenantGroup.validation');
const tenantGroupController = require('../../controllers/tenantGroup.controller');

const router = express.Router();

router
  .route('/')
  .post(auth('admin'), validate(tenantGroupValidation.createTenantGroup), tenantGroupController.createTenantGroup)
  .get(auth('admin', 'user'), validate(tenantGroupValidation.getTenantGroups), tenantGroupController.getTenantGroups);

router
  .route('/:groupId')
  .get(auth('admin', 'user'), validate(tenantGroupValidation.getTenantGroup), tenantGroupController.getTenantGroup)
  .patch(auth('admin'), validate(tenantGroupValidation.updateTenantGroup), tenantGroupController.updateTenantGroup)
  .delete(auth('admin'), validate(tenantGroupValidation.deleteTenantGroup), tenantGroupController.deleteTenantGroup);

module.exports = router;