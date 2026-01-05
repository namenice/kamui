// src/models/rack.model.js
const { DataTypes } = require('sequelize');
const mariadb = require('../config/mariadb');

const Rack = mariadb.define('Rack', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  name: { type: DataTypes.STRING, allowNull: false },
  description: { type: DataTypes.TEXT },
  unit: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 42 },
  roomId: { type: DataTypes.UUID, allowNull: false },
}, { 
  tableName: 'racks',
  indexes: [
    { unique: true, fields: ['name', 'roomId'] }
  ]
});

module.exports = Rack;