const { createDbConnection } = require('../services/common/src/db/connection');
const bcrypt = require('../services/auth-service/node_modules/bcryptjs');

async function setSimpleCredentials() {
  const db = createDbConnection('auth_db');
  const newHash = await bcrypt.hash('admin123', 10);
  
  await db.query(
    'UPDATE auth_users SET password = :password, email = :email, is_super_admin = 1, status = "ACTIVE" WHERE id = 1;',
    {
      replacements: {
        password: newHash,
        email: 'superadmin@stockpilot.io'
      }
    }
  );

  const [users] = await db.query('SELECT id, email, password, role_name, is_super_admin FROM auth_users WHERE id = 1;');
  const match = await bcrypt.compare('admin123', users[0].password);
  
  console.log('----------------------------------------------------');
  console.log('🎉 Super Admin Credentials Set Successfully:');
  console.log('📧 Email:    superadmin@stockpilot.io');
  console.log('🔑 Password: admin123');
  console.log('✅ Hash verified:', match);
  console.log('----------------------------------------------------');
  process.exit(0);
}

setSimpleCredentials();
