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

    await queryInterface.createTable('interface_connections', {
      id: idField,
      
      // ข้อมูลของ Interface ฝั่งเรา (เครื่องลูก)
      name: { type: Sequelize.STRING, allowNull: false }, // e.g. "eth0", "ens192", "vmnic0"
      macAddress: { type: Sequelize.STRING, allowNull: true }, // e.g. "00:1A:2B:3C:4D:5E"
      ipAddress: { type: Sequelize.STRING, allowNull: true }, // e.g. "192.168.1.10" (Service IP)
      speed: { type: Sequelize.STRING, allowNull: true }, // e.g. "10Gbps", "1Gbps"
      type: { type: Sequelize.STRING, allowNull: true }, // e.g. "SFP+", "RJ45", "Fiber"
      
      // เจ้าของ Interface นี้ (Server/Device)
      hardwareId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'hardwares', key: 'id' },
        onUpdate: 'CASCADE', 
        onDelete: 'CASCADE' // ถ้าลบเครื่อง Server, Interface หายด้วย
      },

      // --- ส่วนของการเชื่อมต่อ (Connection) ---
      
      // ปลายทางต่อกับ Switch ตัวไหน? (ชี้กลับไปที่ table hardwares เหมือนกัน)
      connectedSwitchId: {
        type: Sequelize.UUID,
        allowNull: true, // อาจจะยังไม่ได้ต่อสาย หรือ ลอยไว้
        references: { model: 'hardwares', key: 'id' },
        onUpdate: 'CASCADE', 
        onDelete: 'SET NULL' // ถ้าลบ Switch ให้ connection กลายเป็น null (ไม่ลบ Interface ทิ้ง)
      },
      
      // ปลายทางต่อที่ Port อะไรของ Switch?
      connectedPort: { type: Sequelize.STRING, allowNull: true }, // e.g. "Gi1/0/24", "Port 5"

      ...timestampFields
    });

    // Index เพื่อความไวในการค้นหา
    await queryInterface.addIndex('interface_connections', ['hardwareId']); // หา Interface ของเครื่องนี้
    await queryInterface.addIndex('interface_connections', ['connectedSwitchId']); // หาว่า Switch ตัวนี้มีใครมาเกาะบ้าง
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('interface_connections');
  }
};