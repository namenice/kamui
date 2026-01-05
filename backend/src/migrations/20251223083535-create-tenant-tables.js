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

    // --- 1. Tenant Groups (กลุ่มลูกค้า) ---
    await queryInterface.createTable('tenant_groups', {
      id: idField,
      name: { type: Sequelize.STRING, allowNull: false, unique: true }, // ชื่อกลุ่มห้ามซ้ำ
      description: { type: Sequelize.TEXT, allowNull: true },
      ...timestampFields
    });

    // --- 2. Tenants (ลูกค้า) ---
    await queryInterface.createTable('tenants', {
      id: idField,
      name: { type: Sequelize.STRING, allowNull: false },
      description: { type: Sequelize.TEXT, allowNull: true },
      
      // ผูกกับ Group
      tenantGroupId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'tenant_groups', key: 'id' },
        onUpdate: 'CASCADE', onDelete: 'CASCADE'
      },
      ...timestampFields
    });

    // กฎ: ห้ามชื่อ Tenant ซ้ำ ใน Group เดียวกัน
    await queryInterface.addConstraint('tenants', {
      fields: ['name', 'tenantGroupId'],
      type: 'unique',
      name: 'unique_tenant_name_per_group'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('tenants');
    await queryInterface.dropTable('tenant_groups');
  }
};