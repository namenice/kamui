'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('tokens', {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4
      },
      token: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      userId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users', // ต้องตรงกับชื่อตาราง users
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      type: {
        type: Sequelize.ENUM('refresh', 'resetPassword', 'verifyEmail'),
        allowNull: false
      },
      expires: {
        type: Sequelize.DATE,
        allowNull: false
      },
      blacklisted: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });

    // สร้าง Index ที่ token เพื่อให้ค้นหาเร็วๆ
    await queryInterface.addIndex('tokens', ['token']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('tokens');
  }
};