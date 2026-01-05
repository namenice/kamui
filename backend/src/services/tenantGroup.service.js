// src/services/tenantGroup.service.js
const httpStatus = require('http-status');
const { Op } = require('sequelize');
const { TenantGroup } = require('../models');
// 👇 1. Import ตัว Connection เข้ามา (เพื่อใช้ literal)
const mariadb = require('../config/mariadb'); 
const ApiError = require('../utils/ApiError');

const createTenantGroup = async (groupBody) => {
  if (await TenantGroup.findOne({ where: { name: groupBody.name } })) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Group name already taken');
  }
  return TenantGroup.create(groupBody);
};

const queryTenantGroups = async (filter, options) => {
  const limit = options.limit && parseInt(options.limit, 10) > 0 ? parseInt(options.limit, 10) : 10;
  const page = options.page && parseInt(options.page, 10) > 0 ? parseInt(options.page, 10) : 1;
  const offset = (page - 1) * limit;
  const sortBy = options.sortBy || 'createdAt';
  const sortOrder = options.sortOrder || 'DESC';

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

  const { count, rows } = await TenantGroup.findAndCountAll({
    where,
    // 👇 2. เพิ่มส่วนนี้เพื่อดึงจำนวน Tenants
    attributes: {
      include: [
        [
          mariadb.literal(`(
            SELECT COUNT(*)
            FROM tenants AS t
            WHERE t.tenantGroupId = TenantGroup.id
          )`),
          'tenantCount' // ชื่อ field ที่จะส่งไป frontend
        ]
      ]
    },
    limit,
    offset,
    order: [[sortBy, sortOrder.toUpperCase()]],
  });

  return {
    results: rows,
    page,
    limit,
    totalPages: Math.ceil(count / limit),
    totalResults: count,
  };
};

const getTenantGroupById = async (id) => {
  return TenantGroup.findByPk(id);
};

const updateTenantGroupById = async (groupId, updateBody) => {
  const group = await getTenantGroupById(groupId);
  if (!group) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Group not found');
  }
  if (updateBody.name && (await TenantGroup.findOne({ where: { name: updateBody.name } }))) {
    if (updateBody.name !== group.name) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Group name already taken');
    }
  }
  Object.assign(group, updateBody);
  await group.save();
  return group;
};

const deleteTenantGroupById = async (groupId) => {
  const group = await getTenantGroupById(groupId);
  if (!group) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Group not found');
  }
  await group.destroy();
  return group;
};

module.exports = {
  createTenantGroup,
  queryTenantGroups,
  getTenantGroupById,
  updateTenantGroupById,
  deleteTenantGroupById,
};