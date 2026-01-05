const Joi = require('joi');

const createHardware = {
  body: Joi.object().keys({
    name: Joi.string().required(),
    serialNumber: Joi.string().allow('', null),
    status: Joi.string().valid('active', 'maintenance', 'failed', 'offline', 'reserved', 'deprecated').default('active'),
    
    // Details
    oobIp: Joi.string().allow('', null),
    note: Joi.string().allow('', null),
    specifications: Joi.string().allow('', null), // Text field
    
    // Warranty
    warrantyStartDate: Joi.date().allow(null),
    warrantyEndDate: Joi.date().allow(null),

    // Location
    uPosition: Joi.number().integer().min(1).required(),
    rackId: Joi.string().uuid().required(),

    // Relations (Updated)
    hardwareInfoId: Joi.string().uuid().required(), // 👈 ต้องมีตัวนี้
    tenantId: Joi.string().uuid().allow(null, ''),

  }),
};

const getHardwares = {
  query: Joi.object().keys({
    name: Joi.string(),
    serialNumber: Joi.string(),
    status: Joi.string(),
    rackId: Joi.string().uuid(),
    hardwareInfoId: Joi.string().uuid(), // 👈 เปลี่ยนจาก hardwareTypeId เป็น infoId
    tenantId: Joi.string().uuid(),
    search: Joi.string(),
    sortBy: Joi.string(),
    sortOrder: Joi.string().valid('asc', 'desc'),
    limit: Joi.number().integer(),
    page: Joi.number().integer(),
  }),
};

const getHardware = {
  params: Joi.object().keys({
    hardwareId: Joi.string().uuid().required(),
  }),
};

const updateHardware = {
  params: Joi.object().keys({
    hardwareId: Joi.string().uuid().required(),
  }),
  body: Joi.object()
    .keys({
      name: Joi.string(),
      serialNumber: Joi.string().allow('', null),
      status: Joi.string().valid('active', 'maintenance', 'failed', 'offline', 'reserved', 'deprecated'),
      oobIp: Joi.string().allow('', null),
      note: Joi.string().allow('', null),
      specifications: Joi.string().allow('', null),
      warrantyStartDate: Joi.date().allow(null),
      warrantyEndDate: Joi.date().allow(null),
      
      uPosition: Joi.number().integer().min(1),
      rackId: Joi.string().uuid(),
      
      hardwareInfoId: Joi.string().uuid(), // 👈 Update ก็ต้องแก้ด้วย
      tenantId: Joi.string().uuid().allow(null, ''),
    })
    .min(1),
};

const deleteHardware = {
  params: Joi.object().keys({
    hardwareId: Joi.string().uuid().required(),
  }),
};

module.exports = {
  createHardware,
  getHardwares,
  getHardware,
  updateHardware,
  deleteHardware,
};