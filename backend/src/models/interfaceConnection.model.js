// src/models/interfaceConnection.model.js
const { DataTypes } = require('sequelize');
const mariadb = require('../config/mariadb');

const InterfaceConnection = mariadb.define('InterfaceConnection', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  
  // Interface Info
  name: { type: DataTypes.STRING, allowNull: false },
  macAddress: { type: DataTypes.STRING },
  ipAddress: { type: DataTypes.STRING },
  speed: { type: DataTypes.STRING },
  type: { type: DataTypes.STRING },

  // Relation IDs
  hardwareId: { type: DataTypes.UUID, allowNull: false },
  connectedSwitchId: { type: DataTypes.UUID, allowNull: true },
  connectedPort: { type: DataTypes.STRING },

}, { 
  tableName: 'interface_connections' 
});

module.exports = InterfaceConnection;