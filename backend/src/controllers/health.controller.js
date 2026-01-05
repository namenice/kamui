// src/controllers/health.controller.js
const httpStatus = require('http-status');

const getHealth = (req, res) => {
  const healthcheck = {
    uptime: process.uptime(),
    message: 'OK',
    timestamp: Date.now()
  };
  
  res.status(httpStatus.OK).send(healthcheck);
};

module.exports = {
  getHealth,
};