// src/services/room.service.js
const httpStatus = require('http-status');
const { Op } = require('sequelize');
const mariadb = require('../config/mariadb'); 
const { Room, Site, Zone, Region } = require('../models');
const ApiError = require('../utils/ApiError');

/**
 * Create a room
 * @param {Object} roomBody
 * @returns {Promise<Room>}
 */
const createRoom = async (roomBody) => {
  // 1. เช็คว่า Site มีอยู่จริงไหม
  const site = await Site.findByPk(roomBody.siteId);
  if (!site) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Site not found');
  }

  // 2. เช็คชื่อซ้ำ (เฉพาะใน Site เดียวกัน)
  const existingRoom = await Room.findOne({ 
    where: { 
      name: roomBody.name, 
      siteId: roomBody.siteId 
    } 
  });
  
  if (existingRoom) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Room name already taken in this site');
  }

  return Room.create(roomBody);
};

/**
 * Query for rooms
 * @param {Object} filter
 * @param {Object} options
 * @returns {Promise<Object>}
 */
const queryRooms = async (filter, options) => {
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
  if (filter.siteId) {
    where.siteId = filter.siteId;
  }

  const { count, rows } = await Room.findAndCountAll({
    where,
    attributes: {
      include: [
        [
          mariadb.literal(`(
            SELECT COUNT(*)
            FROM racks AS rk
            WHERE rk.roomId = Room.id
          )`),
          'rackCount'
        ]
      ]
    },
    limit,
    offset,
    order: [[sortBy, sortOrder.toUpperCase()]],
    include: [{ 
        model: Site, 
        as: 'site',
        include: [{
            model: Zone,
            as: 'zone',
            include: [{ model: Region, as: 'region' }]
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
 * Get room by id
 * @param {ObjectId} id
 * @returns {Promise<Room>}
 */
const getRoomById = async (id) => {
  return Room.findByPk(id, {
    // 👇 Include ลึกเหมือนกัน
    include: [{ 
        model: Site, 
        as: 'site',
        include: [{
            model: Zone,
            as: 'zone',
            include: [{ model: Region, as: 'region' }]
        }]
    }]
  });
};

/**
 * Update room by id
 * @param {ObjectId} roomId
 * @param {Object} updateBody
 * @returns {Promise<Room>}
 */
const updateRoomById = async (roomId, updateBody) => {
  const room = await getRoomById(roomId);
  if (!room) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Room not found');
  }

  // ถ้าจะเปลี่ยน Site ต้องเช็คว่า Site ใหม่มีจริงไหม
  if (updateBody.siteId) {
     const site = await Site.findByPk(updateBody.siteId);
     if (!site) throw new ApiError(httpStatus.NOT_FOUND, 'Site not found');
  }

  // ถ้าเปลี่ยนชื่อ หรือ เปลี่ยน Site ต้องเช็คว่าชื่อซ้ำไหม
  if (updateBody.name || updateBody.siteId) {
    const targetName = updateBody.name || room.name;
    const targetSiteId = updateBody.siteId || room.siteId;

    const duplicateRoom = await Room.findOne({ 
        where: { name: targetName, siteId: targetSiteId } 
    });

    if (duplicateRoom && duplicateRoom.id !== roomId) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Room name already taken in this site');
    }
  }

  Object.assign(room, updateBody);
  await room.save();
  return room;
};

/**
 * Delete room by id
 * @param {ObjectId} roomId
 * @returns {Promise<Room>}
 */
const deleteRoomById = async (roomId) => {
  const room = await getRoomById(roomId);
  if (!room) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Room not found');
  }
  await room.destroy();
  return room;
};

module.exports = {
  createRoom,
  queryRooms,
  getRoomById,
  updateRoomById,
  deleteRoomById,
};