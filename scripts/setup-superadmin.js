require('dotenv').config();
const bcrypt = require('bcryptjs');
const { Sequelize } = require('sequelize');

const DB_DIALECT = process.env.DB_DIALECT || 'mysql';
const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_PORT = process.env.DB_PORT || 3306;
const DB_USER = process.env.DB_USER || 'root';
const DB_PASSWORD = process.env.DB_PASSWORD || process.env.DB_ROOT_PASSWORD || 'rootpassword';

const sequelize = new Sequelize('auth_db', DB_USER, DB_PASSWORD, {
  host: DB_HOST,
  port: DB_PORT,
  dialect: DB_DIALECT,
  logging: false
});

async function run() {
  try {
    await sequelize.authenticate();
    console.log('✅ Connected to auth_db');

    const email = (process.env.SUPERADMIN_EMAIL || 'superadmin@stockpilot.io').toLowerCase().trim();
    const password = process.env.SUPERADMIN_PASSWORD || 'adminpassword123';
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);

    // Sync table schema if needed
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS auth_users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        tenant_id INT NULL,
        company_code VARCHAR(30) NULL,
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NULL,
        email VARCHAR(150) NOT NULL,
        password VARCHAR(255) NOT NULL,
        role_id INT NULL,
        role_name VARCHAR(50) NOT NULL DEFAULT 'SUPER_ADMIN',
        is_super_admin TINYINT(1) DEFAULT 1,
        status ENUM('ACTIVE', 'INACTIVE', 'SUSPENDED') DEFAULT 'ACTIVE',
        warehouse_id INT NULL,
        warehouse_name VARCHAR(150) NULL,
        last_login_at DATETIME NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY idx_tenant_email (tenant_id, email)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // Check if user exists
    const [existing] = await sequelize.query('SELECT id, email FROM auth_users WHERE email = :email LIMIT 1;', {
      replacements: { email }
    });

    if (existing && existing.length > 0) {
      await sequelize.query(`
        UPDATE auth_users 
        SET password = :password, is_super_admin = 1, role_name = 'SUPER_ADMIN', status = 'ACTIVE'
        WHERE email = :email;
      `, {
        replacements: { email, password: hash }
      });
      console.log(`👑 Super Admin updated successfully: ${email}`);
    } else {
      await sequelize.query(`
        INSERT INTO auth_users (tenant_id, company_code, first_name, last_name, email, password, role_name, is_super_admin, status)
        VALUES (NULL, 'PLATFORM', 'Super', 'Admin', :email, :password, 'SUPER_ADMIN', 1, 'ACTIVE');
      `, {
        replacements: { email, password: hash }
      });
      console.log(`👑 Super Admin created successfully: ${email}`);
    }

    console.log('----------------------------------------------------');
    console.log('🎉 Super Admin Credentials Ready:');
    console.log(`📧 Email:    ${email}`);
    console.log(`🔑 Password: ${password}`);
    console.log('----------------------------------------------------');
    process.exit(0);
  } catch (err) {
    console.error('❌ Setup error:', err);
    process.exit(1);
  }
}

run();
