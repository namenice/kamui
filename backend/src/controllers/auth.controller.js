// src/controllers/auth.controller.js
const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const {authService, userService, tokenService, emailService } = require('../services');

const register = catchAsync(async (req, res) => {
  // 1. สร้าง User
  const user = await userService.createUser(req.body);
  // 2. สร้าง Token ให้เลย (User จะได้ไม่ต้อง Login ซ้ำหลังสมัคร)
  const tokens = await tokenService.generateAuthTokens(user);
  res.status(httpStatus.CREATED).send({ user, tokens });
});

const login = catchAsync(async (req, res) => {
  const { email, password } = req.body;
  // 1. เช็ค Login
  const user = await authService.loginUserWithEmailAndPassword(email, password);
  // 2. สร้าง Token
  const tokens = await tokenService.generateAuthTokens(user);
  res.send({ user, tokens });
});

const logout = catchAsync(async (req, res) => {
  // รับ refreshToken มาจาก Body
  await authService.logout(req.body.refreshToken);
  res.status(httpStatus.NO_CONTENT).send();
});

const refreshTokens = catchAsync(async (req, res) => {
  const tokens = await authService.refreshAuth(req.body.refreshToken);
  res.send({ ...tokens });
});

const forgotPassword = catchAsync(async (req, res) => {
  const resetPasswordToken = await tokenService.generateResetPasswordToken(req.body.email);
  await emailService.sendResetPasswordEmail(req.body.email, resetPasswordToken);
  res.status(httpStatus.NO_CONTENT).send();
});

const resetPassword = catchAsync(async (req, res) => {
  await authService.resetPassword(req.query.token, req.body.password);
  res.status(httpStatus.NO_CONTENT).send();
});

module.exports = {
  register,
  login,
  logout,
  refreshTokens,
  forgotPassword,
  resetPassword,
};