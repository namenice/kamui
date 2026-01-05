// src/middlewares/validate.js

const Joi = require('joi');
const httpStatus = require('http-status');
const pick = require('../utils/pick');
const ApiError = require('../utils/ApiError');

const validate = (schema) => (req, res, next) => {
  // 1. เลือกเฉพาะส่วนที่มีใน schema (params, query, body)
  const validSchema = pick(schema, ['params', 'query', 'body']);
  
  // 2. เลือก object จาก request มาเทียบ
  const object = pick(req, Object.keys(validSchema));
  
  // 3. สั่ง Joi ตรวจสอบ (compile schema ก่อน validate)
  const { value, error } = Joi.compile(validSchema)
    .prefs({ errors: { label: 'key' }, abortEarly: false })
    .validate(object);

  // 4. ถ้ามี Error ให้รวมข้อความแล้ว Throw ออกไป
  if (error) {
    const errorMessage = error.details.map((details) => details.message).join(', ');
    return next(new ApiError(httpStatus.BAD_REQUEST, errorMessage));
  }
  
  // 5. อัปเดต req ด้วยค่าที่ผ่านการ validate แล้ว (Joi อาจมีการแปลง type ให้)
  Object.assign(req, value);
  return next();
};

module.exports = validate;