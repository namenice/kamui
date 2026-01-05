// src/models/hardware.model.js
const { DataTypes } = require('sequelize');
const mariadb = require('../config/mariadb');

const Hardware = mariadb.define('Hardware', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  name: { type: DataTypes.STRING, allowNull: false },
  status: { type: DataTypes.ENUM('active', 'maintenance', 'failed', 'offline', 'reserved', 'deprecated'), defaultValue: 'active' },
  serialNumber: { type: DataTypes.STRING, unique: true },
  oobIp: { type: DataTypes.STRING },
  specifications: { type: DataTypes.TEXT },
  note: { type: DataTypes.TEXT },
  uPosition: { type: DataTypes.INTEGER },
  warrantyStartDate: { type: DataTypes.DATEONLY },
  warrantyEndDate: { type: DataTypes.DATEONLY },

  // Relations FK
  hardwareInfoId: { type: DataTypes.UUID, allowNull: false }, 
  rackId: { type: DataTypes.UUID, allowNull: false },
  tenantId: { type: DataTypes.UUID, allowNull: true },

}, { 
  tableName: 'hardwares' 
});

module.exports = Hardware;