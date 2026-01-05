// src/services/hardwareType.service.js
const httpStatus = require('http-status');
const { Op } = require('sequelize');
const { HardwareType } = require('../models');
const ApiError = require('../utils/ApiError');
const mariadb = require('../config/mariadb');

const createHardwareType = async (body) => {
  if (await HardwareType.findOne({ where: { name: body.name } })) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Hardware Type name already exists');
  }
  return HardwareType.create(body);
};

const queryHardwareTypes = async (filter, options) => {
  const limit = options.limit && parseInt(options.limit, 10) > 0 ? parseInt(options.limit, 10) : 10;
  const page = options.page && parseInt(options.page, 10) > 0 ? parseInt(options.page, 10) : 1;
  const offset = (page - 1) * limit;
  const sortBy = options.sortBy || 'createdAt';
  const sortOrder = options.sortOrder || 'DESC';

  const where = {};
  if (filter.search) {
    where[Op.or] = [
      { name: { [Op.like]: `%${filter.search}%` } },
      { category: { [Op.like]: `%${filter.search}%` } },
      { description: { [Op.like]: `%${filter.search}%` } },
    ];
  }
  if (filter.name) where.name = { [Op.like]: `%${filter.name}%` };
  if (filter.category) where.category = filter.category;

  const { count, rows } = await HardwareType.findAndCountAll({
    where, limit, offset, order: [[sortBy, sortOrder.toUpperCase()]],
    attributes: {
      include: [
        [
          // 👇 แก้ไขตรงนี้ครับ: ต้อง JOIN กับ hardware_infos ก่อนถึงจะเจอ hardwareTypeId
          mariadb.literal(`(
            SELECT COUNT(*)
            FROM hardwares AS h
            INNER JOIN hardware_infos AS hi ON h.hardwareInfoId = hi.id
            WHERE hi.hardwareTypeId = HardwareType.id
          )`),
          'hardwareCount'
        ]
      ]
    },
  });

  return { results: rows, page, limit, totalPages: Math.ceil(count / limit), totalResults: count };
};

const getHardwareTypeById = async (id) => {
  return HardwareType.findByPk(id);
};

const updateHardwareTypeById = async (id, body) => {
  const type = await getHardwareTypeById(id);
  if (!type) throw new ApiError(httpStatus.NOT_FOUND, 'Hardware Type not found');
  
  if (body.name && body.name !== type.name) {
    if (await HardwareType.findOne({ where: { name: body.name } })) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Hardware Type name already exists');
    }
  }
  Object.assign(type, body);
  await type.save();
  return type;
};

const deleteHardwareTypeById = async (id) => {
  const type = await getHardwareTypeById(id);
  if (!type) throw new ApiError(httpStatus.NOT_FOUND, 'Hardware Type not found');
  await type.destroy();
  return type;
};

module.exports = {
  createHardwareType,
  queryHardwareTypes,
  getHardwareTypeById,
  updateHardwareTypeById,
  deleteHardwareTypeById,
};