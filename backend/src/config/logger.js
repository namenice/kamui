// src/config/logger.js
const winston = require('winston');

const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'development' ? 'debug' : 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    // 1. เพิ่มบรรทัดนี้: เพื่อให้ปริ้นท์ Stack Trace เมื่อ log Error object
    winston.format.errors({ stack: true }), 
    process.env.NODE_ENV === 'development' ? winston.format.colorize() : winston.format.uncolorize(),
    winston.format.splat(),
    // 2. ปรับ printf: ให้เช็คว่ามี stack ไหม ถ้ามีให้ต่อท้าย message ไปเลย
    winston.format.printf(({ level, message, timestamp, stack }) => {
      return `${timestamp} ${level}: ${message}${stack ? `\n${stack}` : ''}`;
    })
  ),
  transports: [
    new winston.transports.Console({
      stderrLevels: ['error'],
    }),
  ],
});

module.exports = logger;