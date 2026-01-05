// src/controllers/interfaceConnection.controller.js
const httpStatus = require('http-status');
const pick = require('../utils/pick');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');
const connectionService = require('../services/interfaceConnection.service');

const createConnection = catchAsync(async (req, res) => {
  const conn = await connectionService.createConnection(req.body);
  res.status(httpStatus.CREATED).send(conn);
});

const getConnections = catchAsync(async (req, res) => {
  const filter = pick(req.query, ['hardwareId', 'connectedSwitchId', 'search']); 
  const options = pick(req.query, ['limit', 'page']);
  const result = await connectionService.queryConnections(filter, options);
  res.send(result);
});

const getConnection = catchAsync(async (req, res) => {
  const conn = await connectionService.getConnectionById(req.params.connectionId);
  if (!conn) throw new ApiError(httpStatus.NOT_FOUND, 'Connection not found');
  res.send(conn);
});

const updateConnection = catchAsync(async (req, res) => {
  const conn = await connectionService.updateConnectionById(req.params.connectionId, req.body);
  res.send(conn);
});

const deleteConnection = catchAsync(async (req, res) => {
  await connectionService.deleteConnectionById(req.params.connectionId);
  res.status(httpStatus.NO_CONTENT).send();
});

module.exports = {
  createConnection,
  getConnections,
  getConnection,
  updateConnection,
  deleteConnection,
};