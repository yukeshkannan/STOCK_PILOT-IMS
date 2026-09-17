require('dotenv').config();
const bcrypt = require('bcryptjs');
const app = require('./src/app');
const { sequelize, User } = require('./src/models');
const { initDatabase, eventBus } = require('@stockpilot/common');

const PORT = process.env.PORT || 5001;

async function ensureSuperAdmin() {
  try {
    const email = (process.env.SUPERADMIN_EMAIL || 'superadmin@stockpilot.io').toLowerCase().trim();
    const password = process.env.SUPERADMIN_PASSWORD || 'adminpassword123';
    const firstName = process.env.SUPERADMIN_FIRST_NAME || 'Super';
    const lastName = process.env.SUPERADMIN_LAST_NAME || 'Admin';

    let superAdmin = await User.findOne({
      where: {
        email,
        is_super_admin: true
      }
    });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    if (!superAdmin) {
      superAdmin = await User.findOne({ where: { email } });
      if (superAdmin) {
        await superAdmin.update({
          is_super_admin: true,
          role_name: 'SUPER_ADMIN',
          password: hashedPassword
        });
        console.log(`👑 Super Admin permissions updated for: ${email}`);
      } else {
        await User.create({
          tenant_id: null,
          company_code: 'PLATFORM',
          first_name: firstName,
          last_name: lastName,
          email,
          password: hashedPassword,
          role_name: 'SUPER_ADMIN',
          is_super_admin: true,
          status: 'ACTIVE'
        });
        console.log(`👑 Super Admin automatically provisioned from ENV: ${email}`);
      }
    } else {
      await superAdmin.update({
        password: hashedPassword,
        first_name: firstName,
        last_name: lastName
      });
      console.log(`👑 Super Admin verified & active from ENV: ${email}`);
    }
  } catch (error) {
    console.error('Failed to auto-provision Super Admin from ENV:', error.message);
  }
}

async function startServer() {
  try {
    await initDatabase(sequelize, process.env.DB_NAME || 'auth_db');
    await eventBus.connect();
    await ensureSuperAdmin();

    app.listen(PORT, () => {
      console.log(`🔐 Auth Service running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start Auth Service:', error);
    process.exit(1);
  }
}

startServer();

