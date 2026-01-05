const httpStatus = require('http-status');
const { Op } = require('sequelize');
const mariadb = require('../config/mariadb'); 
const { Site, Zone, Region } = require('../models'); // 👈 1. ต้อง import Region ด้วย
const ApiError = require('../utils/ApiError');

/**
 * Create a site
 * @param {Object} siteBody
 * @returns {Promise<Site>}
 */
const createSite = async (siteBody) => {
  // 1. เช็คว่า Zone มีอยู่จริงไหม
  const zone = await Zone.findByPk(siteBody.zoneId);
  if (!zone) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Zone not found');
  }

  // 2. เช็คชื่อซ้ำ (เฉพาะใน Zone เดียวกัน)
  const existingSite = await Site.findOne({ 
    where: { 
      name: siteBody.name, 
      zoneId: siteBody.zoneId 
    } 
  });
  
  if (existingSite) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Site name already taken in this zone');
  }

  return Site.create(siteBody);
};

/**
 * Query for sites
 * @param {Object} filter
 * @param {Object} options
 * @returns {Promise<Object>}
 */
const querySites = async (filter, options) => {
  const limit = options.limit && parseInt(options.limit, 10) > 0 ? parseInt(options.limit, 10) : 10;
  const page = options.page && parseInt(options.page, 10) > 0 ? parseInt(options.page, 10) : 1;
  const offset = (page - 1) * limit;
  const sortBy = options.sortBy || 'createdAt';
  const sortOrder = options.sortOrder || 'DESC';
  // const order = [[sortBy, sortOrder.toUpperCase()]]; // ใช้อันล่างชัวร์กว่าถ้ามีการ join

  const where = {};
  if (filter.search) {
    where[Op.or] = [
      { name: { [Op.like]: `%${filter.search}%` } },
      { description: { [Op.like]: `%${filter.search}%` } },
    ];
  }

  if (filter.name) {
    where.name = { [Op.like]: `%${filter.name}%` };
  }
  if (filter.zoneId) {
    where.zoneId = filter.zoneId;
  }

  const { count, rows } = await Site.findAndCountAll({
    where,
    attributes: {
      include: [
        [
          mariadb.literal(`(
            SELECT COUNT(*)
            FROM rooms AS r
            WHERE r.siteId = Site.id
          )`),
          'roomCount'
        ]
      ]
    },
    limit,
    offset,
    order: [[sortBy, sortOrder.toUpperCase()]],
    // 👇 2. แก้ตรงนี้: Include ซ้อน เพื่อเอาชื่อ Region ไปโชว์หน้าเว็บ
    include: [{ 
        model: Zone, 
        as: 'zone',
        include: [{ model: Region, as: 'region' }] 
    }], 
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
 * Get site by id
 * @param {ObjectId} id
 * @returns {Promise<Site>}
 */
const getSiteById = async (id) => {
  return Site.findByPk(id, {
    // 👇 3. แก้ตรงนี้เช่นกัน
    include: [{ 
        model: Zone, 
        as: 'zone',
        include: [{ model: Region, as: 'region' }]
    }]
  });
};

/**
 * Update site by id
 * @param {ObjectId} siteId
 * @param {Object} updateBody
 * @returns {Promise<Site>}
 */
const updateSiteById = async (siteId, updateBody) => {
  const site = await getSiteById(siteId);
  if (!site) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Site not found');
  }

  // ถ้าจะเปลี่ยน Zone ต้องเช็คว่า Zone ใหม่มีจริงไหม
  if (updateBody.zoneId) {
     const zone = await Zone.findByPk(updateBody.zoneId);
     if (!zone) throw new ApiError(httpStatus.NOT_FOUND, 'Zone not found');
  }

  // ถ้าเปลี่ยนชื่อ หรือ เปลี่ยน Zone ต้องเช็คว่าชื่อซ้ำไหม
  if (updateBody.name || updateBody.zoneId) {
    const targetName = updateBody.name || site.name;
    const targetZoneId = updateBody.zoneId || site.zoneId;

    const duplicateSite = await Site.findOne({ 
        where: { name: targetName, zoneId: targetZoneId } 
    });

    if (duplicateSite && duplicateSite.id !== siteId) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Site name already taken in this zone');
    }
  }

  Object.assign(site, updateBody);
  await site.save();
  return site;
};

/**
 * Delete site by id
 * @param {ObjectId} siteId
 * @returns {Promise<Site>}
 */
const deleteSiteById = async (siteId) => {
  const site = await getSiteById(siteId);
  if (!site) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Site not found');
  }
  await site.destroy();
  return site;
};

module.exports = {
  createSite,
  querySites,
  getSiteById,
  updateSiteById,
  deleteSiteById,
};