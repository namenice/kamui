// src/routes/v1/site.route.js
const express = require('express');
const auth = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const siteValidation = require('../../validations/site.validation');
const siteController = require('../../controllers/site.controller');

const router = express.Router();

router
  .route('/')
  .post(auth('admin'), validate(siteValidation.createSite), siteController.createSite)
  .get(auth('admin', 'user'), validate(siteValidation.getSites), siteController.getSites);

router
  .route('/:siteId')
  .get(auth('admin', 'user'), validate(siteValidation.getSite), siteController.getSite)
  .patch(auth('admin'), validate(siteValidation.updateSite), siteController.updateSite)
  .delete(auth('admin'), validate(siteValidation.deleteSite), siteController.deleteSite);

module.exports = router;