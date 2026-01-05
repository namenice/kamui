// src/services/interfaceConnection.service.js
const httpStatus = require('http-status');
const { InterfaceConnection, Hardware } = require('../models');
const ApiError = require('../utils/ApiError');
const { Op } = require('sequelize');

const createConnection = async (body) => {
  if (!(await Hardware.findByPk(body.hardwareId))) throw new ApiError(httpStatus.NOT_FOUND, 'Hardware not found');
  if (body.connectedSwitchId && !(await Hardware.findByPk(body.connectedSwitchId))) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Connected Switch not found');
  }
  return InterfaceConnection.create(body);
};

const queryConnections = async (filter, options) => {
  const limit = options.limit && parseInt(options.limit, 10) > 0 ? parseInt(options.limit, 10) : 10;
  const page = options.page && parseInt(options.page, 10) > 0 ? parseInt(options.page, 10) : 1;
  const offset = (page - 1) * limit;

  const where = {};
  if (filter.hardwareId) where.hardwareId = filter.hardwareId;
  if (filter.connectedSwitchId) where.connectedSwitchId = filter.connectedSwitchId;
  if (filter.search) {
    where[Op.or] = [
      { name: { [Op.like]: `%${filter.search}%` } },      // ค้นจากชื่อ Port
      { ipAddress: { [Op.like]: `%${filter.search}%` } }, // ค้นจาก IP
      { macAddress: { [Op.like]: `%${filter.search}%` } }, // ค้นจาก MAC
      // ถ้าอยากค้นทะลุไปชื่อเครื่องแม่ (Advanced) ต้องทำที่ Include แต่เบื้องต้นแค่นี้ก่อนได้ครับ
    ];
  }

  const { count, rows } = await InterfaceConnection.findAndCountAll({
    where, 
    limit, 
    offset,
    include: [
      { model: Hardware, as: 'parentDevice', attributes: ['name', 'serialNumber'] },
      { model: Hardware, as: 'connectedSwitch', attributes: ['name', 'oobIp'] }
    ],
    // เพิ่ม Order ให้เรียงสวยๆ
    order: [['createdAt', 'DESC']]
  });

  return { results: rows, page, limit, totalPages: Math.ceil(count / limit), totalResults: count };
};

const getConnectionById = async (id) => {
  return InterfaceConnection.findByPk(id, {
    include: [
      { model: Hardware, as: 'parentDevice' },
      { model: Hardware, as: 'connectedSwitch' }
    ]
  });
};

const updateConnectionById = async (id, body) => {
  const conn = await getConnectionById(id);
  if (!conn) throw new ApiError(httpStatus.NOT_FOUND, 'Connection not found');

  if (body.hardwareId && !(await Hardware.findByPk(body.hardwareId))) throw new ApiError(httpStatus.NOT_FOUND, 'Hardware not found');
  if (body.connectedSwitchId && !(await Hardware.findByPk(body.connectedSwitchId))) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Connected Switch not found');
  }

  Object.assign(conn, body);
  await conn.save();
  return conn;
};

const deleteConnectionById = async (id) => {
  const conn = await getConnectionById(id);
  if (!conn) throw new ApiError(httpStatus.NOT_FOUND, 'Connection not found');
  await conn.destroy();
  return conn;
};

module.exports = {
  createConnection,
  queryConnections,
  getConnectionById,
  updateConnectionById,
  deleteConnectionById,
};