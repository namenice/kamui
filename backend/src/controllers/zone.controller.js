// src/controllers/zone.controller.js
const httpStatus = require('http-status');
const pick = require('../utils/pick');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');
const zoneService = require('../services/zone.service');

const createZone = catchAsync(async (req, res) => {
  const zone = await zoneService.createZone(req.body);
  res.status(httpStatus.CREATED).send(zone);
});

const getZones = catchAsync(async (req, res) => {
  // รับ regionId มา filter ด้วย
  const filter = pick(req.query, ['name', 'regionId', 'search']);
  const options = pick(req.query, ['sortBy', 'sortOrder', 'limit', 'page']);
  const result = await zoneService.queryZones(filter, options);
  res.send(result);
});

const getZone = catchAsync(async (req, res) => {
  const zone = await zoneService.getZoneById(req.params.zoneId);
  if (!zone) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Zone not found');
  }
  res.send(zone);
});

const updateZone = catchAsync(async (req, res) => {
  const zone = await zoneService.updateZoneById(req.params.zoneId, req.body);
  res.send(zone);
});

const deleteZone = catchAsync(async (req, res) => {
  await zoneService.deleteZoneById(req.params.zoneId);
  res.status(httpStatus.NO_CONTENT).send();
});

module.exports = {
  createZone,
  getZones,
  getZone,
  updateZone,
  deleteZone,
};