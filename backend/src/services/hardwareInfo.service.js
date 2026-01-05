// src/services/hardwareInfo.service.js
const httpStatus = require('http-status');
const { Op } = require('sequelize');
const { HardwareInfo, HardwareType, Hardware } = require('../models');
const ApiError = require('../utils/ApiError');
const mariadb = require('../config/mariadb'); 

const createHardwareInfo = async (body) => {
  const type = await HardwareType.findByPk(body.hardwareTypeId);
  if (!type) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Hardware Type not found');
  }
  
  // Optional: เช็คซ้ำว่า Manufacturer + Model นี้มีอยู่แล้วหรือยัง
  const existing = await HardwareInfo.findOne({ 
      where: { 
          manufacturer: body.manufacturer, 
          model: body.model 
      } 
  });
  if (existing) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'This Model already exists');
  }

  return HardwareInfo.create(body);
};

const queryHardwareInfos = async (filter, options) => {
  const limit = options.limit && parseInt(options.limit, 10) > 0 ? parseInt(options.limit, 10) : 10;
  const page = options.page && parseInt(options.page, 10) > 0 ? parseInt(options.page, 10) : 1;
  const offset = (page - 1) * limit;
  const sortBy = options.sortBy || 'createdAt';
  const sortOrder = options.sortOrder || 'DESC';

  const where = {};
  if (filter.search) {
    where[Op.or] = [
      { manufacturer: { [Op.like]: `%${filter.search}%` } },
      { model: { [Op.like]: `%${filter.search}%` } },
    ];
  }

  if (filter.manufacturer) where.manufacturer = { [Op.like]: `%${filter.manufacturer}%` };
  if (filter.model) where.model = { [Op.like]: `%${filter.model}%` };
  if (filter.hardwareTypeId) where.hardwareTypeId = filter.hardwareTypeId;

const { count, rows } = await HardwareInfo.findAndCountAll({
    where,
    limit,
    offset,
    order: [[sortBy, sortOrder]],
    attributes: {
      include: [
        [
          mariadb.literal(`(
            SELECT COUNT(*)
            FROM hardwares AS h
            WHERE h.hardwareInfoId = HardwareInfo.id
          )`),
          'hardwareCount' 
        ]
      ]
    },
    include: [
      { model: HardwareType, as: 'hardwareType', attributes: ['name'] }
    ]
  });
  return { results: rows, page, limit, totalPages: Math.ceil(count / limit), totalResults: count };
};

const getHardwareInfoById = async (id) => {
  return HardwareInfo.findByPk(id, {
    include: [{ model: HardwareType, as: 'hardwareType' }]
  });
};

const updateHardwareInfoById = async (id, body) => {
  const info = await getHardwareInfoById(id);
  if (!info) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Hardware Info not found');
  }

  if (body.hardwareTypeId) {
     const type = await HardwareType.findByPk(body.hardwareTypeId);
     if (!type) throw new ApiError(httpStatus.NOT_FOUND, 'Hardware Type not found');
  }

  // ถ้ามีการแก้ชื่อรุ่น เช็คซ้ำด้วยว่าไปชนกับอันอื่นไหม
  if ((body.manufacturer || body.model) && (body.manufacturer !== info.manufacturer || body.model !== info.model)) {
      const existing = await HardwareInfo.findOne({
          where: {
              manufacturer: body.manufacturer || info.manufacturer,
              model: body.model || info.model,
              id: { [Op.ne]: id } // ไม่นับตัวเอง
          }
      });
      if (existing) throw new ApiError(httpStatus.BAD_REQUEST, 'This Manufacturer/Model combination already exists');
  }

  Object.assign(info, body);
  await info.save();
  return info;
};

const deleteHardwareInfoById = async (id) => {
  const info = await getHardwareInfoById(id);
  if (!info) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Hardware Info not found');
  }

  // ⚠️ สำคัญ: เช็คก่อนว่ามี Hardware ใช้อยู่ไหม
  const usageCount = await Hardware.count({ where: { hardwareInfoId: id } });
  if (usageCount > 0) {
    throw new ApiError(httpStatus.BAD_REQUEST, `Cannot delete. This model is used by ${usageCount} hardware(s).`);
  }

  await info.destroy();
  return info;
};

module.exports = {
  createHardwareInfo,
  queryHardwareInfos,
  getHardwareInfoById,
  updateHardwareInfoById,
  deleteHardwareInfoById,
};