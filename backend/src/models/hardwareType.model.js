// src/models/hardwareType.model.js
const { DataTypes } = require('sequelize');
const mariadb = require('../config/mariadb');

const HardwareType = mariadb.define('HardwareType', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  name: { type: DataTypes.STRING, allowNull: false, unique: true },
  category: { type: DataTypes.STRING }, // หมวดหมู่ใหญ่ (Optional)
  description: { type: DataTypes.TEXT },
}, { 
  tableName: 'hardware_types' 
});

module.exports = HardwareType;