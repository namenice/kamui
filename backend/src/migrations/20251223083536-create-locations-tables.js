'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const idField = {
      allowNull: false,
      primaryKey: true,
      type: Sequelize.UUID,
      defaultValue: Sequelize.UUIDV4
    };

    const timestampFields = {
      createdAt: { allowNull: false, type: Sequelize.DATE },
      updatedAt: { allowNull: false, type: Sequelize.DATE }
    };

    // --- 1. Regions (ใหญ่สุด: ชื่อห้ามซ้ำเลย) ---
    await queryInterface.createTable('regions', {
      id: idField,
      name: { type: Sequelize.STRING, allowNull: false, unique: true },
      description: { type: Sequelize.TEXT, allowNull: true },
      ...timestampFields
    });

    // --- 2. Zones ---
    await queryInterface.createTable('zones', {
      id: idField,
      name: { type: Sequelize.STRING, allowNull: false },
      description: { type: Sequelize.TEXT, allowNull: true },
      regionId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'regions', key: 'id' },
        onUpdate: 'CASCADE', onDelete: 'CASCADE'
      },
      ...timestampFields
    });
    // กฎ: ห้ามชื่อ Zone ซ้ำ ใน Region เดียวกัน
    await queryInterface.addConstraint('zones', {
      fields: ['name', 'regionId'],
      type: 'unique',
      name: 'unique_zone_name_per_region'
    });

    // --- 3. Sites ---
    await queryInterface.createTable('sites', {
      id: idField,
      name: { type: Sequelize.STRING, allowNull: false },
      description: { type: Sequelize.TEXT, allowNull: true },
      zoneId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'zones', key: 'id' },
        onUpdate: 'CASCADE', onDelete: 'CASCADE'
      },
      ...timestampFields
    });
    // กฎ: ห้ามชื่อ Site ซ้ำ ใน Zone เดียวกัน
    await queryInterface.addConstraint('sites', {
      fields: ['name', 'zoneId'],
      type: 'unique',
      name: 'unique_site_name_per_zone'
    });

    // --- 4. Rooms ---
    await queryInterface.createTable('rooms', {
      id: idField,
      name: { type: Sequelize.STRING, allowNull: false },
      description: { type: Sequelize.TEXT, allowNull: true },
      siteId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'sites', key: 'id' },
        onUpdate: 'CASCADE', onDelete: 'CASCADE'
      },
      ...timestampFields
    });
    // กฎ: ห้ามชื่อ Room ซ้ำ ใน Site เดียวกัน
    await queryInterface.addConstraint('rooms', {
      fields: ['name', 'siteId'],
      type: 'unique',
      name: 'unique_room_name_per_site'
    });

    // --- 5. Racks ---
    await queryInterface.createTable('racks', {
      id: idField,
      name: { type: Sequelize.STRING, allowNull: false },
      description: { type: Sequelize.TEXT, allowNull: true },
      unit: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 42 }, // เพิ่ม Unit ตามที่ขอ
      roomId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'rooms', key: 'id' },
        onUpdate: 'CASCADE', onDelete: 'CASCADE'
      },
      ...timestampFields
    });
    // กฎ: ห้ามชื่อ Rack ซ้ำ ใน Room เดียวกัน
    await queryInterface.addConstraint('racks', {
      fields: ['name', 'roomId'],
      type: 'unique',
      name: 'unique_rack_name_per_room'
    });
  },

  async down(queryInterface, Sequelize) {
    // ลบย้อนศร (ลูก -> แม่)
    await queryInterface.dropTable('racks');
    await queryInterface.dropTable('rooms');
    await queryInterface.dropTable('sites');
    await queryInterface.dropTable('zones');
    await queryInterface.dropTable('regions');
  }
};