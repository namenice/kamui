// src/services/zone.service.js
const httpStatus = require('http-status');
const { Op } = require('sequelize');
const mariadb = require('../config/mariadb'); 
const { Zone, Region } = require('../models');
const ApiError = require('../utils/ApiError');

/**
 * Create a zone
 * @param {Object} zoneBody
 * @returns {Promise<Zone>}
 */
const createZone = async (zoneBody) => {
  // 1. เช็คว่า Region ที่ระบุมา มีอยู่จริงไหม?
  const region = await Region.findByPk(zoneBody.regionId);
  if (!region) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Region not found');
  }

  // 2. เช็คชื่อซ้ำ (เฉพาะใน Region เดียวกัน)
  const existingZone = await Zone.findOne({ 
    where: { 
      name: zoneBody.name, 
      regionId: zoneBody.regionId 
    } 
  });
  
  if (existingZone) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Zone name already taken in this region');
  }

  return Zone.create(zoneBody);
};

/**
 * Query for zones
 * @param {Object} filter
 * @param {Object} options
 * @returns {Promise<Object>}
 */
const queryZones = async (filter, options) => {
  const limit = options.limit && parseInt(options.limit, 10) > 0 ? parseInt(options.limit, 10) : 10;
  const page = options.page && parseInt(options.page, 10) > 0 ? parseInt(options.page, 10) : 1;
  const offset = (page - 1) * limit;
  const sortBy = options.sortBy || 'createdAt';
  const sortOrder = options.sortOrder || 'DESC';
  const order = [[sortBy, sortOrder.toUpperCase()]]; 

  const where = {};
  if (filter.search) {
    where[Op.or] = [
      { name: { [Op.like]: `%${filter.search}%` } },
      { description: { [Op.like]: `%${filter.search}%` } }
    ];
  }

  if (filter.name) {
    where.name = { [Op.like]: `%${filter.name}%` };
  }
  if (filter.regionId) {
    where.regionId = filter.regionId;
  }

  const { count, rows } = await Zone.findAndCountAll({
    where,
    attributes: {
      include: [
        [
          mariadb.literal(`(
            SELECT COUNT(*)
            FROM sites AS s
            WHERE s.zoneId = Zone.id
          )`),
          'siteCount'
        ]
      ]
    },
    limit,
    offset,
    order,
    include: [{ model: Region, as: 'region' }], // แถมข้อมูล Region กลับไปด้วยเลย
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
 * Get zone by id
 * @param {ObjectId} id
 * @returns {Promise<Zone>}
 */
const getZoneById = async (id) => {
  return Zone.findByPk(id, {
    include: [{ model: Region, as: 'region' }]
  });
};

/**
 * Update zone by id
 * @param {ObjectId} zoneId
 * @param {Object} updateBody
 * @returns {Promise<Zone>}
 */
const updateZoneById = async (zoneId, updateBody) => {
  const zone = await getZoneById(zoneId);
  if (!zone) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Zone not found');
  }

  // ถ้าจะเปลี่ยน RegionId ต้องเช็คว่า Region ใหม่มีจริงไหม
  if (updateBody.regionId) {
     const region = await Region.findByPk(updateBody.regionId);
     if (!region) throw new ApiError(httpStatus.NOT_FOUND, 'Region not found');
  }

  // ถ้าเปลี่ยนชื่อ หรือ เปลี่ยน Region ต้องเช็คว่าไปซ้ำกับใครไหม
  if (updateBody.name || updateBody.regionId) {
    const targetName = updateBody.name || zone.name;
    const targetRegionId = updateBody.regionId || zone.regionId;

    const duplicateZone = await Zone.findOne({ 
        where: { name: targetName, regionId: targetRegionId } 
    });

    if (duplicateZone && duplicateZone.id !== zoneId) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Zone name already taken in this region');
    }
  }

  Object.assign(zone, updateBody);
  await zone.save();
  return zone;
};

/**
 * Delete zone by id
 * @param {ObjectId} zoneId
 * @returns {Promise<Zone>}
 */
const deleteZoneById = async (zoneId) => {
  const zone = await getZoneById(zoneId);
  if (!zone) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Zone not found');
  }
  await zone.destroy();
  return zone;
};

module.exports = {
  createZone,
  queryZones,
  getZoneById,
  updateZoneById,
  deleteZoneById,
};