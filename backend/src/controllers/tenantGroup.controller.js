// src/controllers/tenantGroup.controller.js
const httpStatus = require('http-status');
const pick = require('../utils/pick');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');
const tenantGroupService = require('../services/tenantGroup.service');

const createTenantGroup = catchAsync(async (req, res) => {
  const group = await tenantGroupService.createTenantGroup(req.body);
  res.status(httpStatus.CREATED).send(group);
});

const getTenantGroups = catchAsync(async (req, res) => {
  const filter = pick(req.query, ['name', 'search']);
  const options = pick(req.query, ['sortBy', 'sortOrder', 'limit', 'page']);
  const result = await tenantGroupService.queryTenantGroups(filter, options);
  res.send(result);
});

const getTenantGroup = catchAsync(async (req, res) => {
  const group = await tenantGroupService.getTenantGroupById(req.params.groupId);
  if (!group) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Group not found');
  }
  res.send(group);
});

const updateTenantGroup = catchAsync(async (req, res) => {
  const group = await tenantGroupService.updateTenantGroupById(req.params.groupId, req.body);
  res.send(group);
});

const deleteTenantGroup = catchAsync(async (req, res) => {
  await tenantGroupService.deleteTenantGroupById(req.params.groupId);
  res.status(httpStatus.NO_CONTENT).send();
});

module.exports = {
  createTenantGroup,
  getTenantGroups,
  getTenantGroup,
  updateTenantGroup,
  deleteTenantGroup,
};