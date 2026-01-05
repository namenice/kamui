// src/controllers/hardware.controller.js
const httpStatus = require('http-status');
const pick = require('../utils/pick');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');
const hardwareService = require('../services/hardware.service');

const createHardware = catchAsync(async (req, res) => {
  const hardware = await hardwareService.createHardware(req.body);
  res.status(httpStatus.CREATED).send(hardware);
});

const getHardwares = catchAsync(async (req, res) => {
  const filter = pick(req.query, ['name', 'serialNumber', 'rackId', 'hardwareTypeId', 'tenantId', 'status', 'search']);
  const options = pick(req.query, ['sortBy', 'sortOrder', 'limit', 'page']);
  const result = await hardwareService.queryHardwares(filter, options);
  res.send(result);
});

const getHardware = catchAsync(async (req, res) => {
  const hardware = await hardwareService.getHardwareById(req.params.hardwareId);
  if (!hardware) throw new ApiError(httpStatus.NOT_FOUND, 'Hardware not found');
  res.send(hardware);
});

const updateHardware = catchAsync(async (req, res) => {
  const hardware = await hardwareService.updateHardwareById(req.params.hardwareId, req.body);
  res.send(hardware);
});

const deleteHardware = catchAsync(async (req, res) => {
  await hardwareService.deleteHardwareById(req.params.hardwareId);
  res.status(httpStatus.NO_CONTENT).send();
});

module.exports = {
  createHardware,
  getHardwares,
  getHardware,
  updateHardware,
  deleteHardware,
};