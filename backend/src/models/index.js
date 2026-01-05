// src/models/index.js
const mariadb = require('../config/mariadb');

// Authentication
const User = require('./user.model');
const Token = require('./token.model');

// Location Hierarchy
const Region = require('./region.model');
const Zone = require('./zone.model');
const Site = require('./site.model');
const Room = require('./room.model');
const Rack = require('./rack.model');

// Tenants
const TenantGroup = require('./tenantGroup.model');
const Tenant = require('./tenant.model');

// Hardwares
const HardwareType = require('./hardwareType.model');
const HardwareInfo = require('./hardwareInfo.model'); // 👈 Import ตัวใหม่เข้ามา
const Hardware = require('./hardware.model');

// Interface Connections
const InterfaceConnection = require('./interfaceConnection.model');


// --- Location Associations ---
Region.hasMany(Zone, { foreignKey: 'regionId', as: 'zones' });
Zone.belongsTo(Region, { foreignKey: 'regionId', as: 'region' });

Zone.hasMany(Site, { foreignKey: 'zoneId', as: 'sites' });
Site.belongsTo(Zone, { foreignKey: 'zoneId', as: 'zone' });

Site.hasMany(Room, { foreignKey: 'siteId', as: 'rooms' });
Room.belongsTo(Site, { foreignKey: 'siteId', as: 'site' });

Room.hasMany(Rack, { foreignKey: 'roomId', as: 'racks' });
Rack.belongsTo(Room, { foreignKey: 'roomId', as: 'room' });


// --- Tenant Associations ---
TenantGroup.hasMany(Tenant, { foreignKey: 'tenantGroupId', as: 'tenants' });
Tenant.belongsTo(TenantGroup, { foreignKey: 'tenantGroupId', as: 'group' });


// --- Hardware Associations (ปรับปรุงใหม่) ---

// 1. Hardware Type <-> Hardware Info (Master Data)
// 1 Type (เช่น Server) มีได้หลาย Model (เช่น R740, DL380)
HardwareType.hasMany(HardwareInfo, { foreignKey: 'hardwareTypeId', as: 'hardwareInfos' });
HardwareInfo.belongsTo(HardwareType, { foreignKey: 'hardwareTypeId', as: 'hardwareType' });

// 2. Hardware Info <-> Hardware (Physical Items)
// 1 Model (เช่น R740) มีเครื่องจริงได้หลายเครื่อง (SVR-01, SVR-02)
HardwareInfo.hasMany(Hardware, { foreignKey: 'hardwareInfoId', as: 'hardwares' });
Hardware.belongsTo(HardwareInfo, { foreignKey: 'hardwareInfoId', as: 'hardwareInfo' });

// 3. Rack <-> Hardware (Location)
// ความสัมพันธ์นี้ยังคงเดิม ผูกที่ตัว Hardware โดยตรง
Rack.hasMany(Hardware, { foreignKey: 'rackId', as: 'hardwares' });
Hardware.belongsTo(Rack, { foreignKey: 'rackId', as: 'rack' });

// 4. Tenant <-> Hardware (Ownership)
// ความสัมพันธ์นี้ยังคงเดิม ผูกที่ตัว Hardware โดยตรง
Tenant.hasMany(Hardware, { foreignKey: 'tenantId', as: 'hardwares' });
Hardware.belongsTo(Tenant, { foreignKey: 'tenantId', as: 'tenant' });


// --- Interface Connection Associations ---
// 1. เจ้าของ Interface
Hardware.hasMany(InterfaceConnection, { foreignKey: 'hardwareId', as: 'interfaces' });
InterfaceConnection.belongsTo(Hardware, { foreignKey: 'hardwareId', as: 'parentDevice' });

// 2. ปลายทาง Switch (Uplink)
Hardware.hasMany(InterfaceConnection, { foreignKey: 'connectedSwitchId', as: 'uplinkConnections' });
InterfaceConnection.belongsTo(Hardware, { foreignKey: 'connectedSwitchId', as: 'connectedSwitch' });

const db = {
  mariadb,
  User,
  Token,
  Region,
  Zone,
  Site,
  Room,
  Rack,
  TenantGroup,
  Tenant,
  HardwareType,
  HardwareInfo, // 👈 อย่าลืม Export ตัวใหม่ด้วย
  Hardware,
  InterfaceConnection,
};

module.exports = db;