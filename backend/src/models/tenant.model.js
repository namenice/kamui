// src/models/tenant.model.js
const { DataTypes } = require('sequelize');
const mariadb = require('../config/mariadb');

const Tenant = mariadb.define('Tenant', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  name: { type: DataTypes.STRING, allowNull: false },
  description: { type: DataTypes.TEXT },
  tenantGroupId: { type: DataTypes.UUID, allowNull: false },
}, { 
  tableName: 'tenants',
  indexes: [
    { unique: true, fields: ['name', 'tenantGroupId'] }
  ]
});

module.exports = Tenant;