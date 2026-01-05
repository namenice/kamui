// src/controllers/hardwareInfo.controller.js
const httpStatus = require('http-status');
const pick = require('../utils/pick');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');
const hardwareInfoService = require('../services/hardwareInfo.service');

const createHardwareInfo = catchAsync(async (req, res) => {
  const info = await hardwareInfoService.createHardwareInfo(req.body);
  res.status(httpStatus.CREATED).send(info);
});

const getHardwareInfos = catchAsync(async (req, res) => {
  const filter = pick(req.query, ['manufacturer', 'model', 'hardwareTypeId', 'search']);
  const options = pick(req.query, ['sortBy', 'sortOrder', 'limit', 'page']);
  const result = await hardwareInfoService.queryHardwareInfos(filter, options);
  res.send(result);
});

const getHardwareInfo = catchAsync(async (req, res) => {
  const info = await hardwareInfoService.getHardwareInfoById(req.params.infoId);
  if (!info) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Hardware Info not found');
  }
  res.send(info);
});

const updateHardwareInfo = catchAsync(async (req, res) => {
  const info = await hardwareInfoService.updateHardwareInfoById(req.params.infoId, req.body);
  res.send(info);
});

const deleteHardwareInfo = catchAsync(async (req, res) => {
  await hardwareInfoService.deleteHardwareInfoById(req.params.infoId);
  res.status(httpStatus.NO_CONTENT).send();
});

module.exports = {
  createHardwareInfo,
  getHardwareInfos,
  getHardwareInfo,
  updateHardwareInfo,
  deleteHardwareInfo,
};