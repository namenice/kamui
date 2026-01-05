// src/services/region.service.js
const httpStatus = require('http-status');
const { Op } = require('sequelize');
const mariadb = require('../config/mariadb');
const { Region } = require('../models');
const ApiError = require('../utils/ApiError');

/**
 * Create a region
 * @param {Object} regionBody
 * @returns {Promise<Region>}
 */
const createRegion = async (regionBody) => {
  if (await Region.findOne({ where: { name: regionBody.name } })) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Region name already taken');
  }
  return Region.create(regionBody);
};

/**
 * Query for regions
 * @param {Object} filter - Filter options
 * @param {Object} options - Query options
 * @returns {Promise<Object>}
 */
const queryRegions = async (filter, options) => {
  // 1. Pagination
  const limit = options.limit && parseInt(options.limit, 10) > 0 ? parseInt(options.limit, 10) : 10;
  const page = options.page && parseInt(options.page, 10) > 0 ? parseInt(options.page, 10) : 1;
  const offset = (page - 1) * limit;

  // 2. Sorting
  const sortBy = options.sortBy || 'createdAt';
  const sortOrder = options.sortOrder || 'DESC';
  const order = [[sortBy, sortOrder.toUpperCase()]];

  // 3. Filtering
  const where = {};

  if (filter.search) {
    where[Op.or] = [
      { name: { [Op.like]: `%${filter.search}%` } },
      { description: { [Op.like]: `%${filter.search}%` } }
    ];
  }

  if (filter.name) {
    where.name = filter.name;
  }

  // 4. Query
  const { count, rows } = await Region.findAndCountAll({
    where,
    attributes: {
      include: [
        [
          mariadb.literal(`(
            SELECT COUNT(*)
            FROM zones AS z
            WHERE z.regionId = Region.id
          )`),
          'zoneCount'
        ]
      ]
    },
    limit,
    offset,
    order,
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
 * Get region by id
 * @param {string} id
 * @returns {Promise<Region>}
 */
const getRegionById = async (id) => {
  return Region.findByPk(id);
};

/**
 * Update region by id
 * @param {string} regionId
 * @param {Object} updateBody
 * @returns {Promise<Region>}
 */
const updateRegionById = async (regionId, updateBody) => {
  const region = await getRegionById(regionId);
  if (!region) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Region not found');
  }
  
  if (updateBody.name && (await Region.findOne({ where: { name: updateBody.name } }))) {
    if (updateBody.name !== region.name) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Region name already taken');
    }
  }

  Object.assign(region, updateBody);
  await region.save();
  return region;
};

/**
 * Delete region by id
 * @param {string} regionId
 * @returns {Promise<Region>}
 */
const deleteRegionById = async (regionId) => {
  const region = await getRegionById(regionId);
  if (!region) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Region not found');
  }
  await region.destroy();
  return region;
};

// 👇 จุดสำคัญ: ต้อง export ชื่อฟังก์ชันให้ตรงกับที่ Controller เรียกใช้ (queryRegions)
module.exports = {
  createRegion,
  queryRegions, // ต้องมีบรรทัดนี้
  getRegionById,
  updateRegionById,
  deleteRegionById,
};