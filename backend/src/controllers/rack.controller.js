// src/controllers/rack.controller.js
const httpStatus = require('http-status');
const pick = require('../utils/pick');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');
const rackService = require('../services/rack.service');

const createRack = catchAsync(async (req, res) => {
  const rack = await rackService.createRack(req.body);
  res.status(httpStatus.CREATED).send(rack);
});

const getRacks = catchAsync(async (req, res) => {
  const filter = pick(req.query, ['name', 'roomId', 'search']);
  const options = pick(req.query, ['sortBy', 'sortOrder', 'limit', 'page']);
  const result = await rackService.queryRacks(filter, options);
  res.send(result);
});

const getRack = catchAsync(async (req, res) => {
  const rack = await rackService.getRackById(req.params.rackId);
  if (!rack) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Rack not found');
  }
  res.send(rack);
});

const updateRack = catchAsync(async (req, res) => {
  const rack = await rackService.updateRackById(req.params.rackId, req.body);
  res.send(rack);
});

const deleteRack = catchAsync(async (req, res) => {
  await rackService.deleteRackById(req.params.rackId);
  res.status(httpStatus.NO_CONTENT).send();
});

module.exports = {
  createRack,
  getRacks,
  getRack,
  updateRack,
  deleteRack,
};