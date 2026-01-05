// src/models/zone.model.js
const { DataTypes } = require('sequelize');
const mariadb = require('../config/mariadb');

const Zone = mariadb.define('Zone', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  name: { type: DataTypes.STRING, allowNull: false },
  description: { type: DataTypes.TEXT },
  regionId: { type: DataTypes.UUID, allowNull: false },
}, { 
  tableName: 'zones',
  indexes: [
    { unique: true, fields: ['name', 'regionId'] }
  ]
});

module.exports = Zone;