// src/models/hardwareInfo.model.js
const { DataTypes } = require('sequelize');
const mariadb = require('../config/mariadb');

const HardwareInfo = mariadb.define('HardwareInfo', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  manufacturer: { type: DataTypes.STRING, allowNull: false }, // เช่น Dell
  model: { type: DataTypes.STRING, allowNull: false },        // เช่น PowerEdge R740
  height: { type: DataTypes.INTEGER, defaultValue: 1 },       // ความสูง U (User request)
  
  // FK
  hardwareTypeId: { type: DataTypes.UUID, allowNull: false }, 
}, { 
  tableName: 'hardware_infos',
  indexes: [
    { fields: ['manufacturer'] },
    { fields: ['model'] }
  ]
});

module.exports = HardwareInfo;