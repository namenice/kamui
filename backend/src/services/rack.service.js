// src/services/rack.service.js
const httpStatus = require('http-status');
const { Op } = require('sequelize');
const { Rack, Room, Site, Zone, Region } = require('../models');
const ApiError = require('../utils/ApiError');

/**
 * Create a rack
 * @param {Object} rackBody
 * @returns {Promise<Rack>}
 */
const createRack = async (rackBody) => {
  // 1. เช็คว่า Room มีอยู่จริงไหม
  const room = await Room.findByPk(rackBody.roomId);
  if (!room) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Room not found');
  }

  // 2. เช็คชื่อซ้ำ (เฉพาะใน Room เดียวกัน)
  const existingRack = await Rack.findOne({ 
    where: { 
      name: rackBody.name, 
      roomId: rackBody.roomId 
    } 
  });
  
  if (existingRack) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Rack name already taken in this room');
  }

  return Rack.create(rackBody);
};

/**
 * Query for racks
 * @param {Object} filter
 * @param {Object} options
 * @returns {Promise<Object>}
 */
const queryRacks = async (filter, options) => {
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
  if (filter.name) {
    where.name = { [Op.like]: `%${filter.name}%` };
  }
  if (filter.roomId) {
    where.roomId = filter.roomId;
  }

  const { count, rows } = await Rack.findAndCountAll({
    where,
    limit,
    offset,
    order: [[sortBy, sortOrder.toUpperCase()]],
    include: [{ 
        model: Room, 
        as: 'room',
        include: [{
            model: Site,
            as: 'site',
            include: [{
                model: Zone,
                as: 'zone',
                include: [{ model: Region, as: 'region' }]
            }]
        }]
    }], 
  });


  return {
    results: rows,
    page,
    limit,
    totalPages: Math.ceil(count / limit),
    totalResults: count,
  };
};

/**
 * Get rack by id
 * @param {ObjectId} id
 * @returns {Promise<Rack>}
 */
const getRackById = async (id) => {
  return Rack.findByPk(id, {
    // 👇 Include ลึกเหมือนกัน
    include: [{ 
        model: Room, 
        as: 'room',
        include: [{
            model: Site,
            as: 'site',
            include: [{
                model: Zone,
                as: 'zone',
                include: [{ model: Region, as: 'region' }]
            }]
        }]
    }]
  });
};

/**
 * Update rack by id
 * @param {ObjectId} rackId
 * @param {Object} updateBody
 * @returns {Promise<Rack>}
 */
const updateRackById = async (rackId, updateBody) => {
  const rack = await getRackById(rackId);
  if (!rack) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Rack not found');
  }

  // ถ้าจะเปลี่ยน Room ต้องเช็คว่า Room ใหม่มีจริงไหม
  if (updateBody.roomId) {
     const room = await Room.findByPk(updateBody.roomId);
     if (!room) throw new ApiError(httpStatus.NOT_FOUND, 'Room not found');
  }

  // ถ้าเปลี่ยนชื่อ หรือ เปลี่ยน Room ต้องเช็คว่าชื่อซ้ำไหม
  if (updateBody.name || updateBody.roomId) {
    const targetName = updateBody.name || rack.name;
    const targetRoomId = updateBody.roomId || rack.roomId;

    const duplicateRack = await Rack.findOne({ 
        where: { name: targetName, roomId: targetRoomId } 
    });

    if (duplicateRack && duplicateRack.id !== rackId) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Rack name already taken in this room');
    }
  }

  Object.assign(rack, updateBody);
  await rack.save();
  return rack;
};

/**
 * Delete rack by id
 * @param {ObjectId} rackId
 * @returns {Promise<Rack>}
 */
const deleteRackById = async (rackId) => {
  const rack = await getRackById(rackId);
  if (!rack) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Rack not found');
  }
  await rack.destroy();
  return rack;
};

module.exports = {
  createRack,
  queryRacks,
  getRackById,
  updateRackById,
  deleteRackById,
};