// server.js
require('dotenv').config();
const app = require('./src/app');
const logger = require('./src/config/logger');
const { mariadb } = require('./src/models');

// Start Server API
let server;

const startServer = async () => {
  try {
    // 1. Authenticate ผ่าน object ที่รับมาจาก models
    await mariadb.authenticate();
    logger.info('✅ Connected to MariaDB successfully');

    // 2. Start Server
    const PORT = process.env.PORT || 3000;
    const HOST = process.env.HOST || '0.0.0.0';

    server = app.listen(PORT, HOST, () => {
      logger.info(`🚀 Server listening on ${HOST}:${PORT}`);
    });

  } catch (error) {
    logger.error('❌ Error starting server:', error);
    process.exit(1);
  }
};

startServer();

// Graceful Shutdown
const exitHandler = () => {
  if (server) {
    server.close(() => {
      logger.info('Server closed');
      process.exit(1);
    });
  } else {
    process.exit(1);
  }
};

const unexpectedErrorHandler = (error) => {
  logger.error(error);
  exitHandler();
};

process.on('uncaughtException', unexpectedErrorHandler);
process.on('unhandledRejection', unexpectedErrorHandler);

process.on('SIGTERM', () => {
  logger.info('SIGTERM received');
  if (server) {
    server.close();
  }
});