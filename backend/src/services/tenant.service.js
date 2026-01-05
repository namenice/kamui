// src/services/tenant.service.js
const httpStatus = require('http-status');
const { Op } = require('sequelize');
const { Tenant, TenantGroup } = require('../models');
const ApiError = require('../utils/ApiError');

const createTenant = async (tenantBody) => {
  // 1. เช็ค Group มีจริงไหม
  const group = await TenantGroup.findByPk(tenantBody.tenantGroupId);
  if (!group) throw new ApiError(httpStatus.NOT_FOUND, 'Tenant Group not found');

  // 2. เช็คชื่อซ้ำใน Group เดียวกัน
  const existingTenant = await Tenant.findOne({ 
    where: { 
      name: tenantBody.name, 
      tenantGroupId: tenantBody.tenantGroupId 
    } 
  });
  if (existingTenant) throw new ApiError(httpStatus.BAD_REQUEST, 'Tenant name already taken in this group');

  return Tenant.create(tenantBody);
};

const queryTenants = async (filter, options) => {
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
  if (filter.name) where.name = { [Op.like]: `%${filter.name}%` };
  if (filter.tenantGroupId) where.tenantGroupId = filter.tenantGroupId;

  const { count, rows } = await Tenant.findAndCountAll({
    where,
    limit,
    offset,
    order: [[sortBy, sortOrder.toUpperCase()]],
    include: [{ model: TenantGroup, as: 'group' }],
  });

  return { results: rows, page, limit, totalPages: Math.ceil(count / limit), totalResults: count };
};

const getTenantById = async (id) => {
  return Tenant.findByPk(id, { include: [{ model: TenantGroup, as: 'group' }] });
};

const updateTenantById = async (tenantId, updateBody) => {
  const tenant = await getTenantById(tenantId);
  if (!tenant) throw new ApiError(httpStatus.NOT_FOUND, 'Tenant not found');

  if (updateBody.tenantGroupId) {
     const group = await TenantGroup.findByPk(updateBody.tenantGroupId);
     if (!group) throw new ApiError(httpStatus.NOT_FOUND, 'Tenant Group not found');
  }

  if (updateBody.name || updateBody.tenantGroupId) {
    const targetName = updateBody.name || tenant.name;
    const targetGroupId = updateBody.tenantGroupId || tenant.tenantGroupId;

    const duplicateTenant = await Tenant.findOne({ where: { name: targetName, tenantGroupId: targetGroupId } });
    if (duplicateTenant && duplicateTenant.id !== tenantId) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Tenant name already taken in this group');
    }
  }

  Object.assign(tenant, updateBody);
  await tenant.save();
  return tenant;
};

const deleteTenantById = async (tenantId) => {
  const tenant = await getTenantById(tenantId);
  if (!tenant) throw new ApiError(httpStatus.NOT_FOUND, 'Tenant not found');
  await tenant.destroy();
  return tenant;
};

module.exports = {
  createTenant,
  queryTenants,
  getTenantById,
  updateTenantById,
  deleteTenantById,
};