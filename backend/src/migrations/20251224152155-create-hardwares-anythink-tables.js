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

    // --- 1. Hardware Types (Master: ประเภทอุปกรณ์) ---
    // e.g. Server, Switch, Storage
    await queryInterface.createTable('hardware_types', {
      id: idField,
      name: { type: Sequelize.STRING, allowNull: false, unique: true },
      category: { type: Sequelize.STRING, allowNull: true },
      description: { type: Sequelize.TEXT },
      ...timestampFields
    });

    // --- 2. Hardware Infos (Master ใหม่: ข้อมูลรุ่น/ยี่ห้อ) ---
    // e.g. Dell R740, Cisco 2960
    await queryInterface.createTable('hardware_infos', {
      id: idField,
      manufacturer: { type: Sequelize.STRING, allowNull: false }, // e.g. Dell
      model: { type: Sequelize.STRING, allowNull: false },        // e.g. PowerEdge R740
      height: { type: Sequelize.INTEGER, defaultValue: 1 },       // e.g. 2U
      
      // ผูกกับ Hardware Type
      hardwareTypeId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'hardware_types', key: 'id' },
        onUpdate: 'CASCADE', onDelete: 'RESTRICT'
      },
      ...timestampFields
    });

    // --- 3. Hardwares (Inventory Item: ตัวเครื่องจริง) ---
    await queryInterface.createTable('hardwares', {
      id: idField,
      name: { type: Sequelize.STRING, allowNull: false }, // Hostname e.g. SVR-01

      // Asset & Status
      serialNumber: { type: Sequelize.STRING, unique: true },
      status: { 
        type: Sequelize.ENUM('active', 'maintenance', 'failed', 'offline', 'reserved', 'deprecated'),
        defaultValue: 'active' 
      },
      
      // Mgmt & Details
      oobIp: { type: Sequelize.STRING },
      note: { type: Sequelize.TEXT },
      // เปลี่ยนจาก JSON เป็น TEXT ตามที่แก้ล่าสุด
      specifications: { type: Sequelize.TEXT }, 

      // Warranty
      warrantyStartDate: { type: Sequelize.DATEONLY },
      warrantyEndDate: { type: Sequelize.DATEONLY },

      // Location (Rack)
      uPosition: { type: Sequelize.INTEGER },
      // ❌ ตัด uHeight ออกแล้ว (ไปใช้จาก hardware_infos)
      rackId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'racks', key: 'id' },
        onUpdate: 'CASCADE', onDelete: 'CASCADE'
      },

      // Ownership (Tenant)
      tenantId: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: 'tenants', key: 'id' },
        onUpdate: 'CASCADE', onDelete: 'SET NULL'
      },

      // Relation ใหม่: ผูกกับ Hardware Info (แทนการเก็บ Manufacturer/Model ตรงๆ)
      hardwareInfoId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'hardware_infos', key: 'id' },
        onUpdate: 'CASCADE', onDelete: 'RESTRICT'
      },

      // ❌ ตัด hardwareTypeId, manufacturer, model, partNumber ออกแล้ว

      ...timestampFields
    });

    // --- 4. Interface Connections (สายแลน/พอร์ต) ---
    await queryInterface.createTable('interface_connections', {
      id: idField,
      name: { type: Sequelize.STRING, allowNull: false }, // e.g. eth0
      macAddress: { type: Sequelize.STRING },
      ipAddress: { type: Sequelize.STRING },
      speed: { type: Sequelize.STRING },
      type: { type: Sequelize.STRING },

      // เจ้าของ Port
      hardwareId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'hardwares', key: 'id' },
        onUpdate: 'CASCADE', onDelete: 'CASCADE'
      },
      // ปลายทางที่ต่อไปหา (Switch)
      connectedSwitchId: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: 'hardwares', key: 'id' },
        onUpdate: 'CASCADE', onDelete: 'SET NULL'
      },
      connectedPort: { type: Sequelize.STRING },

      ...timestampFields
    });
  },

  async down(queryInterface, Sequelize) {
    // ลบย้อนหลัง (Reverse Order)
    await queryInterface.dropTable('interface_connections');
    await queryInterface.dropTable('hardwares');
    await queryInterface.dropTable('hardware_infos'); // ลบ table ใหม่
    await queryInterface.dropTable('hardware_types');
  }
};