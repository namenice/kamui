// seedAdmin.js
const { User } = require('./src/models');
const bcrypt = require('bcryptjs');

const createAdmin = async () => {
  try {
    const email = 'admin@example.com';
    const password = 'admin1234'; // รหัสผ่าน
    const firstName = 'Super';       // 👈 เพิ่มอันนี้
    const lastName = 'Admin';        // 👈 เพิ่มอันนี้

    // 1. เช็คก่อนว่ามี User นี้หรือยัง
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      console.log('⚠️  User already exists:', email);
      process.exit(0);
    }

    // 2. Hash Password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 3. Create User
    const newUser = await User.create({
      firstName, // 👈 เปลี่ยนจาก name เป็น firstName
      lastName,  // 👈 เพิ่ม lastName
      email,
      password: hashedPassword, 
      role: 'admin',
      isEmailVerified: true,
      status: 'active' 
    });

    console.log('✅ Admin User created successfully!');
    console.log(`📧 Email: ${email}`);
    console.log(`🔑 Password: ${password}`);
    console.log(`🆔 ID: ${newUser.id}`);

  } catch (error) {
    console.error('❌ Error creating admin:', error);
  } finally {
    process.exit();
  }
};

createAdmin();