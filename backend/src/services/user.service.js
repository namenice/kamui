// src/services/user.service.js
const httpStatus = require('http-status');
const bcrypt = require('bcryptjs');
const { Op } = require('sequelize'); // เรียกใช้ Operator สำหรับ Search (LIKE, OR)
const { User } = require('../models');
const ApiError = require('../utils/ApiError');

/**
 * Create a user
 * @param {Object} userBody
 * @returns {Promise<User>}
 */
const createUser = async (userBody) => {
  if (await User.findOne({ where: { email: userBody.email } })) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Email already taken');
  }
  
  // Hash Password
  const hashedPassword = await bcrypt.hash(userBody.password, 8);
  
  const user = await User.create({ ...userBody, password: hashedPassword });
  return user;
};

/**
 * Query for users
 * @param {Object} filter - Mongo style filter
 * @param {Object} options - Query options
 * @param {string} [options.sortBy] - Sort option in the format: sortField:(desc|asc)
 * @param {number} [options.limit] - Maximum number of results per page (default = 10)
 * @param {number} [options.page] - Current page (default = 1)
 * @returns {Promise<Object>}
 */
const queryUsers = async (filter, options) => {
  // 1. Pagination Setup
  const limit = options.limit && parseInt(options.limit, 10) > 0 ? parseInt(options.limit, 10) : 10;
  const page = options.page && parseInt(options.page, 10) > 0 ? parseInt(options.page, 10) : 1;
  const offset = (page - 1) * limit;

  // 2. Filter & Search Setup
  const where = {};

  // Filter by Role
  if (filter.role) {
    where.role = filter.role;
  }

  // Search Logic (Partial Match: ชื่อ หรือ นามสกุล หรือ อีเมล)
  if (filter.search) {
    where[Op.or] = [
      { firstName: { [Op.like]: `%${filter.search}%` } },
      { lastName:  { [Op.like]: `%${filter.search}%` } },
      { email:     { [Op.like]: `%${filter.search}%` } }
    ];
  }

  // 3. Sorting Setup
  let order = [['createdAt', 'DESC']]; // Default: ใหม่สุดขึ้นก่อน
  if (options.sortBy) {
    // รองรับการส่งมาแบบ ?sortBy=firstName&sortOrder=asc
    const sortOrder = options.sortOrder === 'asc' ? 'ASC' : 'DESC';
    order = [[options.sortBy, sortOrder]];
  }

  // 4. Execute Query
  const { count, rows } = await User.findAndCountAll({
    where,
    limit,
    offset,
    order,
    // attributes: { exclude: ['password'] } // ปกติ Model เราซ่อนให้อยู่แล้วจาก defaultScope
  });

  return {
    results: rows,
    page,
    limit,
    totalPages: Math.ceil(count / limit),
    totalResults: count,
  };
};

/**
 * Get user by id
 * @param {ObjectId} id
 * @returns {Promise<User>}
 */
const getUserById = async (id) => {
  const user = await User.findByPk(id);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }
  return user;
};

/**
 * Get user by email
 * @param {string} email
 * @returns {Promise<User>}
 */
const getUserByEmail = async (email) => {
  return User.findOne({ where: { email } });
};

/**
 * Update user by id
 * @param {ObjectId} userId
 * @param {Object} updateBody
 * @returns {Promise<User>}
 */
const updateUserById = async (userId, updateBody) => {
  const user = await getUserById(userId);

  // เช็ค Email ซ้ำ (กรณีมีการเปลี่ยน Email)
  if (updateBody.email && (await User.findOne({ where: { email: updateBody.email } }))) {
    // ต้องเช็คด้วยว่า Email ที่ซ้ำไม่ใช่ของตัวเอง
    if (updateBody.email !== user.email) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Email already taken');
    }
  }

  // ถ้ามีการเปลี่ยน Password ต้อง Hash ใหม่
  if (updateBody.password) {
    updateBody.password = await bcrypt.hash(updateBody.password, 8);
  }

  Object.assign(user, updateBody);
  await user.save();
  return user;
};

/**
 * Delete user by id
 * @param {ObjectId} userId
 * @returns {Promise<User>}
 */
const deleteUserById = async (userId) => {
  const user = await getUserById(userId);
  await user.destroy();
  return user;
};

/**
 * Get user by email with password (for login)
 * @param {string} email
 * @returns {Promise<User>}
 */
const getUserByEmailWithPassword = async (email) => {
  // ใช้ scope 'withPassword' ที่เรานิยามไว้ใน Model เพื่อให้มัน return password ออกมาด้วย
  return User.scope('withPassword').findOne({ where: { email } });
};

module.exports = {
  createUser,
  queryUsers,
  getUserById,
  getUserByEmail,
  updateUserById,
  deleteUserById,
  getUserByEmailWithPassword,
};