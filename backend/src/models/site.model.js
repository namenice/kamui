// src/models/site.model.js
const { DataTypes } = require('sequelize');
const mariadb = require('../config/mariadb');

const Site = mariadb.define('Site', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  name: { type: DataTypes.STRING, allowNull: false },
  description: { type: DataTypes.TEXT },
  zoneId: { type: DataTypes.UUID, allowNull: false },
}, { 
  tableName: 'sites',
  indexes: [
    { unique: true, fields: ['name', 'zoneId'] }
  ]
});

module.exports = Site;