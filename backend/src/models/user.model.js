// src/models/user.model.js

const { DataTypes } = require('sequelize');
const mariadb = require('../config/mariadb');
const bcrypt = require('bcryptjs');

const User = mariadb.define('User', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  firstName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  lastName: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true, // Validate format email
    }
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
    // เราจะใช้ Hook เพื่อซ่อน password ตอน return ค่ากลับ (Security)
  },
  role: {
    type: DataTypes.ENUM('user', 'admin', 'moderator'),
    defaultValue: 'user',
  },
  status: {
    type: DataTypes.ENUM('active', 'pending', 'banned'),
    defaultValue: 'active',
  },
  isEmailVerified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  lastLoginAt: {
    type: DataTypes.DATE,
  }
}, {
  tableName: 'users',
  timestamps: true,
  paranoid: true, // เปิดใช้ Soft Delete (deletedAt)
  
  // Scopes ช่วยซ่อน field ลับ เช่น password ไม่ให้หลุดออกไปตอน query ปกติ
  defaultScope: {
    attributes: { exclude: ['password', 'deletedAt'] }
  },
  scopes: {
    withPassword: { attributes: { } } // ใช้ scope นี้ถ้าต้องการ check password ตอน login
  }
});

User.prototype.isPasswordMatch = async function (password) {
  return bcrypt.compare(password, this.password);
};

// Remove Field ที่ไม่อยากแสดง
User.prototype.toJSON = function () {
  const values = { ...this.get() }; // ดึงค่า raw data ออกมา
  
  // ลบ field ที่ไม่อยากให้หลุดออกไป
  delete values.password;
  
  return values;
};

module.exports = User;