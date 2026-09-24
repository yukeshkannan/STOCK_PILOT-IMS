const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env'), override: true });
const app = require('./src/app');
const { sequelize, Tenant, TenantUser, Role, Permission } = require('./src/models');
const { initDatabase, eventBus, EVENTS, PERMISSIONS, ROLES, DEFAULT_ROLE_PERMISSIONS } = require('@stockpilot/common');

const PORT = process.env.PORT || 5002;

async function seedDefaultRolesAndPermissions() {
  try {
    // Seed Permissions
    for (const [key, name] of Object.entries(PERMISSIONS)) {
      const module = key.split('_')[0] || 'GENERAL';
      await Permission.findOrCreate({
        where: { name },
        defaults: {
          name,
          module,
          description: `Permission to ${name.replace(/_/g, ' ').toLowerCase()}`
        }
      });
    }

    // Seed System Roles
    for (const roleName of Object.values(ROLES)) {
      const [role] = await Role.findOrCreate({
        where: { name: roleName, is_system: true },
        defaults: {
          name: roleName,
          description: `Default system role for ${roleName}`,
          is_system: true
        }
      });

      // Bind Permissions
      const assignedPerms = DEFAULT_ROLE_PERMISSIONS[roleName] || [];
      if (assignedPerms.length) {
        const perms = await Permission.findAll({ where: { name: assignedPerms } });
        await role.setPermissions(perms);
      }
    }
  } catch (err) {
    console.warn('Roles/Permissions seeding notice:', err.message);
  }
}

async function startServer() {
  try {
    await initDatabase(sequelize, process.env.DB_NAME || 'tenant_db');
    await seedDefaultRolesAndPermissions();
    await eventBus.connect();

    // Event Consumer for TENANT_CREATED
    await eventBus.subscribe('tenant-service-queue', EVENTS.TENANT_CREATED, async (data) => {
      try {
        const [tenant] = await Tenant.findOrCreate({
          where: { id: data.tenantId },
          defaults: {
            id: data.tenantId,
            company_code: data.companyCode,
            company_name: data.companyName,
            email: data.email,
            phone: data.phone || null,
            status: 'ACTIVE'
          }
        });

        // Create initial admin user
        const adminRole = await Role.findOne({ where: { name: ROLES.ADMIN, is_system: true } });
        await TenantUser.findOrCreate({
          where: { tenant_id: data.tenantId, email: data.email },
          defaults: {
            tenant_id: data.tenantId,
            first_name: 'Admin',
            last_name: '',
            email: data.email,
            phone: data.phone || null,
            role_id: adminRole ? adminRole.id : null,
            role_name: ROLES.ADMIN,
            status: 'ACTIVE'
          }
        });

        console.log(`[Tenant Service] Processed TENANT_CREATED for tenant [${data.companyCode}]`);
      } catch (err) {
        console.error('[Tenant Service] Error handling TENANT_CREATED:', err.message);
      }
    });

    app.listen(PORT, () => {
      console.log(`🏢 Tenant & User Service running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start Tenant Service:', error);
    process.exit(1);
  }
}

startServer();
