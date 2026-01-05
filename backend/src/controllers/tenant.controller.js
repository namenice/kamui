// src/controllers/tenant.controller.js
const httpStatus = require('http-status');
const pick = require('../utils/pick');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');
const tenantService = require('../services/tenant.service');

const createTenant = catchAsync(async (req, res) => {
  const tenant = await tenantService.createTenant(req.body);
  res.status(httpStatus.CREATED).send(tenant);
});

const getTenants = catchAsync(async (req, res) => {
  const filter = pick(req.query, ['name', 'tenantGroupId', 'search']);
  const options = pick(req.query, ['sortBy', 'sortOrder', 'limit', 'page']);
  const result = await tenantService.queryTenants(filter, options);
  res.send(result);
});

const getTenant = catchAsync(async (req, res) => {
  const tenant = await tenantService.getTenantById(req.params.tenantId);
  if (!tenant) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Tenant not found');
  }
  res.send(tenant);
});

const updateTenant = catchAsync(async (req, res) => {
  const tenant = await tenantService.updateTenantById(req.params.tenantId, req.body);
  res.send(tenant);
});

const deleteTenant = catchAsync(async (req, res) => {
  await tenantService.deleteTenantById(req.params.tenantId);
  res.status(httpStatus.NO_CONTENT).send();
});

module.exports = {
  createTenant,
  getTenants,
  getTenant,
  updateTenant,
  deleteTenant,
};