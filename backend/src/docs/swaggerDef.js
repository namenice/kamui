// src/docs/swaggerDef.js
require('dotenv').config();
const { version } = require('../../package.json');
const config = require('../config/config');

const swaggerDef = {
  openapi: '3.0.0',
  info: {
    title: 'Hardware Management API Documentation',
    version,
    description: 'This is a REST API for Hardware Management System',
    license: {
      name: 'MIT',
      url: 'https://github.com/hagopj13/node-express-boilerplate/blob/master/LICENSE',
    },
  },
  servers: [
    {
      url: `http://172.71.7.194:${process.env.PORT}/api/v1`,
      description: 'Development Server',
    },
  ],
};

module.exports = swaggerDef;