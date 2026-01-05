// src/services/auth.service.js

const httpStatus = require('http-status');
const tokenService = require('./token.service'); // เรียก token service
const userService = require('./user.service');
const { Token } = require('../models'); // เรียก Model
const { tokenTypes } = require('../config/tokens');
const ApiError = require('../utils/ApiError');

/**
 * Login with username and password
 * @param {string} email
 * @param {string} password
 * @returns {Promise<User>}
 */
const loginUserWithEmailAndPassword = async (email, password) => {

  const user = await userService.getUserByEmail(email); 
  const userWithPassword = await userService.getUserByEmailWithPassword(email);

  if (!userWithPassword || !(await userWithPassword.isPasswordMatch(password))) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Incorrect email or password');
  }

  return userWithPassword;
};

const logout = async (refreshToken) => {
  // หา Token ใน DB
  const refreshTokenDoc = await Token.findOne({ 
      where: { token: refreshToken, type: tokenTypes.REFRESH, blacklisted: false } 
  });
  
  if (!refreshTokenDoc) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Not found');
  }
  
  // ลบทิ้งเลย (Hard Delete) หรือจะแก้ blacklisted = true ก็ได้
  await refreshTokenDoc.destroy();
};

// ฟังก์ชัน Refresh Token (ขอ Token ใหม่)
const refreshAuth = async (refreshToken) => {
  try {
    // ตรวจสอบว่า Token ถูกต้องและมีใน DB ไหม
    const refreshTokenDoc = await tokenService.verifyToken(refreshToken, tokenTypes.REFRESH);
    const user = await userService.getUserById(refreshTokenDoc.userId);
    if (!user) {
      throw new Error();
    }
    
    // ลบใบเก่าทิ้ง (Refresh Token Rotation - เพื่อความปลอดภัยสูงสุด)
    await refreshTokenDoc.destroy();
    
    // ออกใบใหม่ให้
    return tokenService.generateAuthTokens(user);
  } catch (error) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Please authenticate');
  }
};

const resetPassword = async (resetPasswordToken, newPassword) => {
  try {
    // 1. ตรวจสอบ Token (ว่าถูกต้อง และยังไม่หมดอายุ)
    const resetPasswordTokenDoc = await tokenService.verifyToken(resetPasswordToken, tokenTypes.RESET_PASSWORD);
    
    // 2. หา User เจ้าของ Token
    const user = await userService.getUserById(resetPasswordTokenDoc.userId);
    if (!user) {
      throw new Error();
    }
    
    // 3. อัปเดตรหัสผ่านใหม่
    await userService.updateUserById(user.id, { password: newPassword });
    await Token.destroy({ where: { userId: user.id, type: tokenTypes.RESET_PASSWORD } });
    await Token.destroy({ where: { userId: user.id, type: tokenTypes.REFRESH } });

  } catch (error) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Password reset failed');
  }
};

module.exports = {
  loginUserWithEmailAndPassword,
  logout,     
  refreshAuth,
  resetPassword,
};