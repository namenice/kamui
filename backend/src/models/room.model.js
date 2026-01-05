// src/models/room.model.js
const { DataTypes } = require('sequelize');
const mariadb = require('../config/mariadb');

const Room = mariadb.define('Room', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  name: { type: DataTypes.STRING, allowNull: false },
  description: { type: DataTypes.TEXT },
  siteId: { type: DataTypes.UUID, allowNull: false },
}, { 
  tableName: 'rooms',
  indexes: [
    { unique: true, fields: ['name', 'siteId'] }
  ]
});

module.exports = Room;