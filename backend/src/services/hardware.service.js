// src/services/hardware.service.js
const httpStatus = require('http-status');
const { Op } = require('sequelize');
const { Hardware, HardwareType, HardwareInfo, Rack, Tenant, InterfaceConnection, Room, Site, Zone, Region } = require('../models');
const ApiError = require('../utils/ApiError');

const createHardware = async (body) => {
  // Check Relations
  if (!(await Rack.findByPk(body.rackId))) throw new ApiError(httpStatus.NOT_FOUND, 'Rack not found');
  
  // 👇 เปลี่ยนจากเช็ค Type เป็นเช็ค Info (Model รุ่น)
  if (!(await HardwareInfo.findByPk(body.hardwareInfoId))) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Hardware Model (Info) not found');
  }

  if (body.tenantId && !(await Tenant.findByPk(body.tenantId))) throw new ApiError(httpStatus.NOT_FOUND, 'Tenant not found');

  // Check Serial Number Unique
  if (body.serialNumber && await Hardware.findOne({ where: { serialNumber: body.serialNumber } })) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Serial Number already exists');
  }

  return Hardware.create(body);
};

const queryHardwares = async (filter, options) => {
  const limit = options.limit && parseInt(options.limit, 10) > 0 ? parseInt(options.limit, 10) : 10;
  const page = options.page && parseInt(options.page, 10) > 0 ? parseInt(options.page, 10) : 1;
  const offset = (page - 1) * limit;
  const sortBy = options.sortBy || 'createdAt';
  const sortOrder = options.sortOrder || 'DESC';

  const where = {};
  
  // 👇 Logic การ Search แบบใหม่ (ต้องอ้างอิงผ่าน relation $hardwareInfo...$)
  if (filter.search) {
    where[Op.or] = [
      { name: { [Op.like]: `%${filter.search}%` } },
      { serialNumber: { [Op.like]: `%${filter.search}%` } },
      // Search ทะลุไปที่ตาราง HardwareInfo
      { '$hardwareInfo.manufacturer$': { [Op.like]: `%${filter.search}%` } }, 
      { '$hardwareInfo.model$': { [Op.like]: `%${filter.search}%` } },
    ];
  }

  if (filter.name) where.name = { [Op.like]: `%${filter.name}%` };
  if (filter.serialNumber) where.serialNumber = filter.serialNumber;
  if (filter.status) where.status = filter.status;
  
  // Filter Relations
  if (filter.rackId) where.rackId = filter.rackId;
  if (filter.tenantId) where.tenantId = filter.tenantId;

  // 👇 ถ้าจะกรองตาม hardwareTypeId ต้องกรองผ่าน Relation
  if (filter.hardwareTypeId) {
      where['$hardwareInfo.hardwareTypeId$'] = filter.hardwareTypeId;
  }

  const { count, rows } = await Hardware.findAndCountAll({
    where, 
    limit, 
    offset, 
    order: [[sortBy, sortOrder]],
    include: [
      // 👇 เปลี่ยน Relation ตรงนี้: Include Info -> แล้วค่อย Include Type
      { 
        model: HardwareInfo, 
        as: 'hardwareInfo',
        include: [{ model: HardwareType, as: 'hardwareType' }] 
      },
      { model: Tenant, as: 'tenant' },
      
      // Location Path
      { 
        model: Rack, 
        as: 'rack',
        include: [{
            model: Room, as: 'room',
            include: [{
                model: Site, as: 'site',
                include: [{ model: Zone, as: 'zone', include: ['region'] }]
            }]
        }]
      },
      { 
        model: InterfaceConnection, 
        as: 'interfaces', 
        include: [
            { model: Hardware, as: 'connectedSwitch', attributes: ['name', 'oobIp'] } 
        ]
      },
    ],
  });

  return { results: rows, page, limit, totalPages: Math.ceil(count / limit), totalResults: count };
};

const getHardwareById = async (id) => {
  return Hardware.findByPk(id, {
    include: [
      // 👇 เปลี่ยนตรงนี้เช่นกัน
      { 
        model: HardwareInfo, 
        as: 'hardwareInfo',
        include: [{ model: HardwareType, as: 'hardwareType' }] 
      },
      { model: Rack, as: 'rack' },
      { model: Tenant, as: 'tenant' },
      { model: InterfaceConnection, as: 'interfaces' }
    ]
  });
};

const updateHardwareById = async (id, body) => {
  const hardware = await getHardwareById(id);
  if (!hardware) throw new ApiError(httpStatus.NOT_FOUND, 'Hardware not found');

  // Check Foreign Keys if updated
  if (body.rackId && !(await Rack.findByPk(body.rackId))) throw new ApiError(httpStatus.NOT_FOUND, 'Rack not found');
  
  // 👇 เช็ค HardwareInfo แทน
  if (body.hardwareInfoId && !(await HardwareInfo.findByPk(body.hardwareInfoId))) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Hardware Model (Info) not found');
  }

  if (body.tenantId && !(await Tenant.findByPk(body.tenantId))) throw new ApiError(httpStatus.NOT_FOUND, 'Tenant not found');

  // Check Serial Uniqueness
  if (body.serialNumber && body.serialNumber !== hardware.serialNumber) {
    if (await Hardware.findOne({ where: { serialNumber: body.serialNumber } })) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Serial Number already exists');
    }
  }

  Object.assign(hardware, body);
  await hardware.save();
  return hardware;
};

const deleteHardwareById = async (id) => {
  const hardware = await getHardwareById(id);
  if (!hardware) throw new ApiError(httpStatus.NOT_FOUND, 'Hardware not found');
  await hardware.destroy();
  return hardware;
};

module.exports = {
  createHardware,
  queryHardwares,
  getHardwareById,
  updateHardwareById,
  deleteHardwareById,
};