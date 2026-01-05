// src/app.js
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const routes = require('./routes/v1');
const logger = require('./config/logger');
const passport = require('passport');
const { jwtStrategy } = require('./config/passport');
const { errorConverter, errorHandler } = require('./middlewares/error')
const { apiLimiter } = require('./middlewares/rateLimiter');

const app = express();

app.set('trust proxy', 1);

// 1. Set Security HTTP headers
app.use(helmet({
  contentSecurityPolicy: false, // ปิด CSP ไปก่อน เพราะ Swagger ต้องใช้ Script/Style แบบ inline
  crossOriginEmbedderPolicy: false, // แก้ปัญหา Cross-Origin Resource
}));

// 2. Parse json request body
app.use(express.json());

// 3. Parse urlencoded request body
app.use(express.urlencoded({ extended: true }));

// 4. Enable CORS
app.use(cors());
app.options('*', cors());

// 5. Logger Middleware (Morgan)
app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));

// 6. API Routes
app.use(passport.initialize());
passport.use('jwt', jwtStrategy);
app.use('/api/v1', routes);

// 7. Handle 404 Not Found
app.use((req, res, next) => {
  res.status(404).send({ code: 404, message: 'Not found' });
});

// 👇 8. Global Error Handler (เพิ่มตรงนี้!)
// แปลง error อื่นๆ ให้เป็น ApiError
app.use(errorConverter);
// จัดการ error และส่ง response กลับไป
app.use(errorHandler);

module.exports = app;