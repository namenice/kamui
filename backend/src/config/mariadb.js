// src/config/mariadb.js

const { Sequelize } = require('sequelize');
const logger = require('./logger'); // เรียกใช้ Logger ที่เราสร้างไว้

const mariadb = new Sequelize(
  process.env.DB_NAME, 		// || 'kamui',      // ชื่อ Database
  process.env.DB_USER, 		// || 'app_user',   // User
  process.env.DB_PASSWORD, 	// || 'app_password', // Password
  {
    host: process.env.DB_HOST, 	// || 'mariadb', // Host (ชื่อ Service ใน Docker Compose)
    dialect: 'mysql',           // ระบุว่าเป็น MariaDB
    port: process.env.DB_PORT || 3306,
    logging: (msg) => logger.debug(msg),    // ให้ Log SQL query ลง Logger
    pool: {
      max: 5,  
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
);

module.exports = mariadb;
