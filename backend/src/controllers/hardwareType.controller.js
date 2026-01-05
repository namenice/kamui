// src/controllers/hardwareType.controller.js
const httpStatus = require('http-status');
const pick = require('../utils/pick');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');
const hardwareTypeService = require('../services/hardwareType.service');

const createHardwareType = catchAsync(async (req, res) => {
  const type = await hardwareTypeService.createHardwareType(req.body);
  res.status(httpStatus.CREATED).send(type);
});

const getHardwareTypes = catchAsync(async (req, res) => {
  const filter = pick(req.query, ['name', 'category', 'search']);
  const options = pick(req.query, ['sortBy', 'sortOrder', 'limit', 'page']);
  const result = await hardwareTypeService.queryHardwareTypes(filter, options);
  res.send(result);
});

const getHardwareType = catchAsync(async (req, res) => {
  const type = await hardwareTypeService.getHardwareTypeById(req.params.typeId);
  if (!type) throw new ApiError(httpStatus.NOT_FOUND, 'Hardware Type not found');
  res.send(type);
});

const updateHardwareType = catchAsync(async (req, res) => {
  const type = await hardwareTypeService.updateHardwareTypeById(req.params.typeId, req.body);
  res.send(type);
});

const deleteHardwareType = catchAsync(async (req, res) => {
  await hardwareTypeService.deleteHardwareTypeById(req.params.typeId);
  res.status(httpStatus.NO_CONTENT).send();
});

module.exports = {
  createHardwareType,
  getHardwareTypes,
  getHardwareType,
  updateHardwareType,
  deleteHardwareType,
};