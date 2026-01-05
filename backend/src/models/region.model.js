// src/models/region.model.js

const { DataTypes } = require('sequelize');
const mariadb = require('../config/mariadb');

const Region = mariadb.define('Region', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  name: { type: DataTypes.STRING, allowNull: false, unique: true },
  description: { type: DataTypes.TEXT },
}, { 
  tableName: 'regions' 
});

module.exports = Region;