// src/models/tenantGroup.model.js
const { DataTypes } = require('sequelize');
const mariadb = require('../config/mariadb');

const TenantGroup = mariadb.define('TenantGroup', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  name: { type: DataTypes.STRING, allowNull: false, unique: true },
  description: { type: DataTypes.TEXT },
}, { 
  tableName: 'tenant_groups' 
});

module.exports = TenantGroup;