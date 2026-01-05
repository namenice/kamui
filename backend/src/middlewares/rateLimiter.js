// src/middlewares/rateLimiter.js

const rateLimit = require('express-rate-limit');

// 1. สำหรับ Auth (Login/Register) - เข้มงวด 🔒
// อนุญาตให้ยิงได้แค่ 20 ครั้ง ในเวลา 15 นาที ต่อ 1 IP
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 นาที
  max: 20, // จำนวนครั้งสูงสุด
  skipSuccessfulRequests: true, // (Optional) ถ้า Login ผ่าน ไม่นับแต้ม (จะได้ไม่โดนบล็อกถ้าเน็ตหลุดแล้วเข้าใหม่)
  message: {
    code: 429,
    message: 'Too many login attempts from this IP, please try again after 15 minutes'
  },
  standardHeaders: true, // ส่ง RateLimit headers กลับไปบอก client (X-RateLimit-Limit)
  legacyHeaders: false, // ปิด header แบบเก่า (X-RateLimit-Remaining)
});

// 2. สำหรับ API ทั่วไป - ผ่อนปรน 🌍
// อนุญาต 100 ครั้ง ใน 15 นาที (ปรับได้ตามความเหมาะสมของ App)
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: {
    code: 429,
    message: 'Too many requests, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = {
  authLimiter,
  apiLimiter,
};