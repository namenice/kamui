'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('users', {
      // 1. Identity (ใช้ UUID เพื่อความปลอดภัย)
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4
      },
      
      // 2. Profile Info
      firstName: {
        type: Sequelize.STRING(100), // จำกัดความยาวช่วยเรื่อง performance
        allowNull: false
      },
      lastName: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      
      // 3. Authentication (Login)
      email: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true, // ห้ามซ้ำเด็ดขาด
      },
      password: {
        type: Sequelize.STRING,
        allowNull: false, // เก็บ Hash เท่านั้น (ห้าม Plain text)
      },
      
      // 4. Authorization & Status (Control)
      role: {
        type: Sequelize.ENUM('user', 'admin', 'moderator'),
        defaultValue: 'user',
        allowNull: false
      },
      status: {
        type: Sequelize.ENUM('active', 'pending', 'banned'),
        defaultValue: 'active',
        allowNull: false
      },
      isEmailVerified: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },

      // 5. Audit Log (System fields)
      lastLoginAt: {
        type: Sequelize.DATE,
        allowNull: true
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      deletedAt: { // สำหรับ Soft Delete
        type: Sequelize.DATE,
        allowNull: true
      }
    });

    // 6. Indexing (สำคัญมากสำหรับ Production)
    // เพิ่ม Index ให้ Email เพื่อให้ Query เร็วขึ้น
    await queryInterface.addIndex('users', ['email']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('users');
  }
};