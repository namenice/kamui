// src/routes/v1/health.route.js
const express = require('express');
const healthController = require('../../controllers/health.controller');

const router = express.Router();

router.get('/', healthController.getHealth);

module.exports = router;