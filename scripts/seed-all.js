const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
process.env.DB_DIALECT = process.env.DB_DIALECT || 'sqlite';
const bcrypt = require('../services/auth-service/node_modules/bcryptjs');
const { ROLES, DEFAULT_ROLE_PERMISSIONS, STOCK_MOVEMENT_TYPES, TRANSFER_STATUS, PURCHASE_STATUS, SALE_STATUS, PAYMENT_STATUS, PAYMENT_METHODS } = require('../services/common/src/constants');

// Models
const authModels = require('../services/auth-service/src/models');
const tenantModels = require('../services/tenant-service/src/models');
const productModels = require('../services/product-service/src/models');
const inventoryModels = require('../services/inventory-service/src/models');
const warehouseModels = require('../services/warehouse-service/src/models');
const purchaseModels = require('../services/purchase-service/src/models');
const salesModels = require('../services/sales-service/src/models');
const financeModels = require('../services/finance-service/src/models');
const notificationModels = require('../services/notification-service/src/models');

const { initDatabase } = require('../services/common/src/db/connection');

async function seedDatabase() {
  console.log('Starting full database synchronization and seeding...');

  // 1. Sync all databases
  await initDatabase(authModels.sequelize, 'auth_db');
  await initDatabase(tenantModels.sequelize, 'tenant_db');
  await initDatabase(productModels.sequelize, 'product_db');
  await initDatabase(inventoryModels.sequelize, 'inventory_db');
  await initDatabase(warehouseModels.sequelize, 'warehouse_db');
  await initDatabase(purchaseModels.sequelize, 'purchase_db');
  await initDatabase(salesModels.sequelize, 'sales_db');
  await initDatabase(financeModels.sequelize, 'finance_db');
  await initDatabase(notificationModels.sequelize, 'notification_db');

  const salt = await bcrypt.genSalt(10);
  const commonPasswordHash = await bcrypt.hash('password123', salt);
  const superAdminPasswordHash = await bcrypt.hash('adminpassword123', salt);

  // 2. Seed Super Admin
  await authModels.User.findOrCreate({
    where: { email: 'superadmin@stockpilot.io' },
    defaults: {
      tenant_id: null,
      company_code: 'PLATFORM',
      first_name: 'Platform',
      last_name: 'Super Admin',
      email: 'superadmin@stockpilot.io',
      password: superAdminPasswordHash,
      role_name: ROLES.SUPER_ADMIN,
      is_super_admin: true,
      status: 'ACTIVE'
    }
  });

  // 3. Define Tenants
  const tenants = [
    {
      id: 1,
      name: 'ABC Electronics Ltd',
      code: 'ABC001',
      email: 'admin@abc.com',
      phone: '+91 98765 00001',
      address: 'Tech Park, Whitefield, Bengaluru, Karnataka - 560066',
      taxNumber: '29ABCDE1234F1Z5',
      currency: 'INR',
      currencySymbol: '₹',
      products: [
        { code: 'LAP-XPS15', name: 'Dell XPS 15 OLED Laptop', cat: 'Laptops', brand: 'Dell', unit: 'PCS', cost: 85000, price: 115000, minStock: 5, maxStock: 50 },
        { code: 'PHN-IP15', name: 'Apple iPhone 15 Pro 256GB', cat: 'Smartphones', brand: 'Apple', unit: 'PCS', cost: 95000, price: 129000, minStock: 8, maxStock: 100 },
        { code: 'PHN-S24', name: 'Samsung Galaxy S24 Ultra', cat: 'Smartphones', brand: 'Samsung', unit: 'PCS', cost: 88000, price: 119000, minStock: 6, maxStock: 80 },
        { code: 'AUD-WH1000', name: 'Sony WH-1000XM5 Wireless Headphones', cat: 'Audio', brand: 'Sony', unit: 'PCS', cost: 18000, price: 26990, minStock: 10, maxStock: 150 },
        { code: 'ACC-MXM3', name: 'Logitech MX Master 3S Mouse', cat: 'Accessories', brand: 'Logitech', unit: 'PCS', cost: 5500, price: 8995, minStock: 15, maxStock: 200 },
        { code: 'MON-DELL27', name: 'Dell UltraSharp 27" 4K USB-C Monitor', cat: 'Monitors', brand: 'Dell', unit: 'PCS', cost: 32000, price: 44500, minStock: 4, maxStock: 40 }
      ],
      warehouses: [
        { name: 'Central Warehouse (Bengaluru)', code: 'CWH-BLR', address: 'Hosur Road, Bengaluru', isDefault: true, capacity: 20000 },
        { name: 'Regional Hub (Mumbai)', code: 'RWH-MUM', address: 'Bhiwandi Logistics Hub, Mumbai', isDefault: false, capacity: 15000 },
        { name: 'Retail Outlet (Delhi)', code: 'ST-DEL', address: 'Nehru Place, New Delhi', isDefault: false, capacity: 5000 }
      ],
      suppliers: [
        { name: 'TechSource India Pvt Ltd', contact: 'Rahul Sharma', email: 'orders@techsource.in', phone: '+91 98765 43210', gstin: '27AAACT2819R1Z1' },
        { name: 'Global Tech Components Ltd', contact: 'Vikram Mehta', email: 'sales@globaltech.com', phone: '+91 91234 56789', gstin: '29AABCG1234F1Z8' }
      ],
      customers: [
        { name: 'Infosys Solutions Tech', phone: '+91 99887 76655', email: 'procurement@infosys.com', gstin: '29AAACI1234D1Z2', creditLimit: 200000 },
        { name: 'Priya Sharma (Retail)', phone: '+91 98111 22233', email: 'priya.s@gmail.com', creditLimit: 25000 },
        { name: 'Apex Digital Hub', phone: '+91 97444 55566', email: 'contact@apexdigital.in', creditLimit: 100000 }
      ]
    },
    {
      id: 2,
      name: 'Sri Lakshmi Traders',
      code: 'SLT002',
      email: 'admin@lakshmi.com',
      phone: '+91 98765 00002',
      address: 'Koyambedu Wholesale Market, Chennai, Tamil Nadu - 600107',
      taxNumber: '33AABCL5678P1Z3',
      currency: 'INR',
      currencySymbol: '₹',
      products: [
        { code: 'RIC-SONA-25', name: 'Sona Masoori Premium Rice 25kg', cat: 'Rice & Grains', brand: 'Lakshmi Brand', unit: 'BAG', cost: 1200, price: 1450, minStock: 20, maxStock: 500 },
        { code: 'OIL-SUN-15', name: 'Sunpure Refined Sunflower Oil 15L', cat: 'Edible Oils', brand: 'Sunpure', unit: 'TIN', cost: 1650, price: 1920, minStock: 15, maxStock: 300 },
        { code: 'DAL-TOOR-30', name: 'Premium Unpolished Toor Dal 30kg', cat: 'Pulses', brand: 'FarmFresh', unit: 'BAG', cost: 3800, price: 4400, minStock: 10, maxStock: 200 }
      ],
      warehouses: [
        { name: 'Main Godown (Chennai)', code: 'GDN-CHN', address: 'Koyambedu, Chennai', isDefault: true, capacity: 50000 },
        { name: 'Madurai Branch Depo', code: 'DEP-MDU', address: 'Mattuthavani, Madurai', isDefault: false, capacity: 25000 }
      ],
      suppliers: [
        { name: 'Andhra Rice Mills Agro', contact: 'Srinivas Rao', email: 'sales@andhrarice.com', phone: '+91 94440 12345', gstin: '37AAACR1234R1Z1' }
      ],
      customers: [
        { name: 'Annapoorna Supermarket', phone: '+91 98400 99887', email: 'purchase@annapoorna.in', creditLimit: 300000 }
      ]
    },
    {
      id: 3,
      name: 'Kumar Industrial Distributors',
      code: 'KUM003',
      email: 'admin@kumar.com',
      phone: '+91 98765 00003',
      address: 'Peenya Industrial Area, Phase 2, Bengaluru - 560058',
      taxNumber: '29KUMAR9876Q1Z9',
      currency: 'INR',
      currencySymbol: '₹',
      products: [
        { code: 'PMP-IND-5HP', name: 'Crompton 5HP Industrial Submersible Pump', cat: 'Pumps & Motors', brand: 'Crompton', unit: 'UNIT', cost: 22000, price: 29500, minStock: 5, maxStock: 40 },
        { code: 'VALV-BALL-2IN', name: 'Heavy Duty 2-inch Brass Ball Valve', cat: 'Valves & Fittings', brand: 'Zoloto', unit: 'PCS', cost: 850, price: 1350, minStock: 30, maxStock: 500 }
      ],
      warehouses: [
        { name: 'Peenya Yard 1', code: 'YRD-PNY', address: 'Peenya Phase 2, Bengaluru', isDefault: true, capacity: 30000 }
      ],
      suppliers: [
        { name: 'Apex Metal & Valves Ltd', contact: 'Rajesh Kumar', email: 'sales@apexvalves.com', phone: '+91 98800 11223', gstin: '29AAAPA1234K1Z0' }
      ],
      customers: [
        { name: 'Metro Water Infra Projects', phone: '+91 98866 55443', email: 'metroprojects@gmail.com', creditLimit: 500000 }
      ]
    }
  ];

  for (const t of tenants) {
    console.log(`\n🏢 Seeding Tenant: [${t.code}] ${t.name}`);

    // Auth DB
    await authModels.TenantLookup.findOrCreate({
      where: { tenant_id: t.id },
      defaults: {
        tenant_id: t.id,
        company_code: t.code,
        company_name: t.name,
        status: 'ACTIVE'
      }
    });

    // Users in Auth DB
    const users = [
      { email: t.email, firstName: 'Tenant', lastName: 'Admin', role: ROLES.ADMIN },
      { email: `manager@${t.email.split('@')[1]}`, firstName: 'Operations', lastName: 'Manager', role: ROLES.MANAGER },
      { email: `staff@${t.email.split('@')[1]}`, firstName: 'Sales', lastName: 'Staff', role: ROLES.STAFF },
      { email: `accountant@${t.email.split('@')[1]}`, firstName: 'Finance', lastName: 'Accountant', role: ROLES.ACCOUNTANT }
    ];

    for (const u of users) {
      await authModels.User.findOrCreate({
        where: { tenant_id: t.id, email: u.email },
        defaults: {
          tenant_id: t.id,
          company_code: t.code,
          first_name: u.firstName,
          last_name: u.lastName,
          email: u.email,
          password: commonPasswordHash,
          role_name: u.role,
          is_super_admin: false,
          status: 'ACTIVE'
        }
      });
    }

    // Tenant DB
    await tenantModels.Tenant.findOrCreate({
      where: { id: t.id },
      defaults: {
        id: t.id,
        company_code: t.code,
        company_name: t.name,
        email: t.email,
        phone: t.phone,
        address: t.address,
        tax_number: t.taxNumber,
        currency: t.currency,
        currency_symbol: t.currencySymbol,
        status: 'ACTIVE'
      }
    });

    for (const u of users) {
      await tenantModels.TenantUser.findOrCreate({
        where: { tenant_id: t.id, email: u.email },
        defaults: {
          tenant_id: t.id,
          first_name: u.firstName,
          last_name: u.lastName,
          email: u.email,
          phone: t.phone,
          role_name: u.role,
          status: 'ACTIVE'
        }
      });
    }

    // Warehouses
    const createdWarehouses = [];
    for (const wh of t.warehouses) {
      const [createdWh] = await warehouseModels.Warehouse.findOrCreate({
        where: { tenant_id: t.id, code: wh.code },
        defaults: {
          tenant_id: t.id,
          name: wh.name,
          code: wh.code,
          address: wh.address,
          city: wh.address.split(',')[1] || 'Metro',
          manager_name: 'Warehouse Incharge',
          capacity: wh.capacity,
          is_default: wh.isDefault,
          status: 'ACTIVE'
        }
      });
      createdWarehouses.push(createdWh);
    }

    // Categories & Brands
    const createdProducts = [];
    for (const p of t.products) {
      const [category] = await productModels.Category.findOrCreate({
        where: { tenant_id: t.id, name: p.cat },
        defaults: { tenant_id: t.id, name: p.cat, code: p.cat.substring(0, 4).toUpperCase() }
      });

      const [brand] = await productModels.Brand.findOrCreate({
        where: { tenant_id: t.id, name: p.brand },
        defaults: { tenant_id: t.id, name: p.brand }
      });

      const [prod] = await productModels.Product.findOrCreate({
        where: { tenant_id: t.id, product_code: p.code },
        defaults: {
          tenant_id: t.id,
          product_code: p.code,
          name: p.name,
          description: `${p.name} - High quality verified inventory item.`,
          category_id: category.id,
          brand_id: brand.id,
          unit: p.unit,
          purchase_price: p.cost,
          selling_price: p.price,
          tax_rate: 18.00,
          minimum_stock: p.minStock,
          maximum_stock: p.maxStock,
          barcode: p.code,
          status: 'ACTIVE'
        }
      });
      createdProducts.push(prod);

      // Seed Stock for this product across warehouses
      for (const wh of createdWarehouses) {
        const initialQty = wh.is_default ? 35 : 15;
        const [stock] = await inventoryModels.Stock.findOrCreate({
          where: { tenant_id: t.id, product_id: prod.id, warehouse_id: wh.id },
          defaults: {
            tenant_id: t.id,
            product_id: prod.id,
            product_code: prod.product_code,
            product_name: prod.name,
            warehouse_id: wh.id,
            warehouse_name: wh.name,
            current_stock: initialQty,
            reserved_stock: 0,
            available_stock: initialQty,
            minimum_stock: prod.minimum_stock,
            maximum_stock: prod.maximum_stock
          }
        });

        // Stock movement initial
        await inventoryModels.StockMovement.findOrCreate({
          where: { tenant_id: t.id, product_id: prod.id, warehouse_id: wh.id, reference_type: 'INITIAL_STOCK' },
          defaults: {
            tenant_id: t.id,
            product_id: prod.id,
            product_code: prod.product_code,
            product_name: prod.name,
            warehouse_id: wh.id,
            warehouse_name: wh.name,
            movement_type: STOCK_MOVEMENT_TYPES.PURCHASE,
            quantity: initialQty,
            balance_after: initialQty,
            reference_type: 'INITIAL_STOCK',
            reference_id: 'INIT-001',
            notes: 'Initial warehouse intake',
            created_by: 'System Seeder'
          }
        });
      }
    }

    // Suppliers
    const createdSuppliers = [];
    for (const s of t.suppliers) {
      const [supplier] = await purchaseModels.Supplier.findOrCreate({
        where: { tenant_id: t.id, name: s.name },
        defaults: {
          tenant_id: t.id,
          name: s.name,
          contact_person: s.contact,
          email: s.email,
          phone: s.phone,
          gstin: s.gstin,
          status: 'ACTIVE'
        }
      });
      createdSuppliers.push(supplier);
    }

    // Customers
    const createdCustomers = [];
    for (const c of t.customers) {
      const [cust] = await salesModels.Customer.findOrCreate({
        where: { tenant_id: t.id, name: c.name },
        defaults: {
          tenant_id: t.id,
          name: c.name,
          phone: c.phone,
          email: c.email,
          gstin: c.gstin || null,
          credit_limit: c.creditLimit,
          status: 'ACTIVE'
        }
      });
      createdCustomers.push(cust);
    }

    // Seed a completed PO
    if (createdProducts.length && createdSuppliers.length && createdWarehouses.length) {
      const mainWh = createdWarehouses[0];
      const p1 = createdProducts[0];
      const poNum = `PO-2026-${String(t.id).padStart(4, '0')}`;
      const itemSub = p1.purchase_price * 10;
      const itemTax = itemSub * 0.18;
      const poGrand = itemSub + itemTax;

      const [po] = await purchaseModels.Purchase.findOrCreate({
        where: { tenant_id: t.id, po_number: poNum },
        defaults: {
          tenant_id: t.id,
          po_number: poNum,
          supplier_id: createdSuppliers[0].id,
          supplier_name: createdSuppliers[0].name,
          warehouse_id: mainWh.id,
          warehouse_name: mainWh.name,
          status: PURCHASE_STATUS.APPROVED,
          subtotal: itemSub,
          tax_amount: itemTax,
          grand_total: poGrand,
          payment_status: PAYMENT_STATUS.PAID,
          paid_amount: poGrand,
          due_amount: 0,
          created_by: 'Admin'
        }
      });

      await purchaseModels.PurchaseItem.findOrCreate({
        where: { purchase_id: po.id, product_id: p1.id },
        defaults: {
          purchase_id: po.id,
          product_id: p1.id,
          product_code: p1.product_code,
          product_name: p1.name,
          unit_price: p1.purchase_price,
          quantity: 10,
          tax_rate: 18.00,
          tax_amount: itemTax,
          total_price: poGrand
        }
      });
    }

    // Seed a completed Sale Invoice
    if (createdProducts.length && createdCustomers.length && createdWarehouses.length) {
      const mainWh = createdWarehouses[0];
      const p1 = createdProducts[0];
      const invNum = `INV-2026-${String(t.id).padStart(4, '0')}`;
      const itemSub = p1.selling_price * 2;
      const itemTax = itemSub * 0.18;
      const invGrand = itemSub + itemTax;

      const [sale] = await salesModels.Sale.findOrCreate({
        where: { tenant_id: t.id, invoice_number: invNum },
        defaults: {
          tenant_id: t.id,
          invoice_number: invNum,
          customer_id: createdCustomers[0].id,
          customer_name: createdCustomers[0].name,
          customer_phone: createdCustomers[0].phone,
          warehouse_id: mainWh.id,
          warehouse_name: mainWh.name,
          status: SALE_STATUS.COMPLETED,
          subtotal: itemSub,
          tax_amount: itemTax,
          grand_total: invGrand,
          payment_method: PAYMENT_METHODS.UPI,
          payment_status: PAYMENT_STATUS.PAID,
          paid_amount: invGrand,
          due_amount: 0,
          created_by: 'Admin'
        }
      });

      await salesModels.SaleItem.findOrCreate({
        where: { sale_id: sale.id, product_id: p1.id },
        defaults: {
          sale_id: sale.id,
          product_id: p1.id,
          product_code: p1.product_code,
          product_name: p1.name,
          unit_price: p1.selling_price,
          cost_price: p1.purchase_price,
          quantity: 2,
          tax_rate: 18.00,
          tax_amount: itemTax,
          total_price: invGrand
        }
      });

      // Finance Receipt
      await financeModels.Payment.findOrCreate({
        where: { tenant_id: t.id, payment_number: `PAY-2026-${String(t.id).padStart(4, '0')}` },
        defaults: {
          tenant_id: t.id,
          payment_number: `PAY-2026-${String(t.id).padStart(4, '0')}`,
          type: 'RECEIPT',
          reference_type: 'SALE',
          reference_id: invNum,
          party_name: createdCustomers[0].name,
          payment_method: PAYMENT_METHODS.UPI,
          amount: invGrand,
          notes: `Receipt from Invoice #${invNum}`,
          created_by: 'Admin'
        }
      });
    }

    // Seed Sample Expenses
    const expensesList = [
      { title: 'Warehouse Rent (Monthly)', category: 'RENT', amount: 45000, recipient: 'RealEstate Estates Ltd' },
      { title: 'Electricity & Internet Bills', category: 'UTILITIES', amount: 8200, recipient: 'Power Distribution Corp' },
      { title: 'Logistics & Inter-city Freight', category: 'LOGISTICS', amount: 14500, recipient: 'BlueDart Express' }
    ];

    let expIndex = 1;
    for (const exp of expensesList) {
      const expNum = `EXP-2026-${String(t.id * 10 + expIndex).padStart(4, '0')}`;
      await financeModels.Expense.findOrCreate({
        where: { tenant_id: t.id, expense_number: expNum },
        defaults: {
          tenant_id: t.id,
          expense_number: expNum,
          title: exp.title,
          category: exp.category,
          amount: exp.amount,
          payment_method: PAYMENT_METHODS.BANK_TRANSFER,
          recipient: exp.recipient,
          created_by: 'Admin'
        }
      });
      expIndex++;
    }

    // Notifications
    await notificationModels.Notification.findOrCreate({
      where: { tenant_id: t.id, title: 'Welcome to StockPilot!' },
      defaults: {
        tenant_id: t.id,
        title: 'Welcome to StockPilot!',
        message: `Your company account [${t.name}] is fully activated with multi-warehouse inventory management.`,
        type: 'SYSTEM',
        is_read: false
      }
    });

    await notificationModels.Notification.findOrCreate({
      where: { tenant_id: t.id, title: '📦 Multi-Warehouse Active' },
      defaults: {
        tenant_id: t.id,
        title: '📦 Multi-Warehouse Active',
        message: `${t.warehouses.length} Warehouses and inventory tracking are configured.`,
        type: 'TRANSFER',
        is_read: false
      }
    });
  }

  console.log('\n✨ Database seeding completed successfully for all 9 microservices!');
  console.log('\n-----------------------------------------------------------');
  console.log('🔑 Quick Login Credentials:');
  console.log('1. Super Admin:  Company: PLATFORM | Email: superadmin@stockpilot.io | Pass: adminpassword123');
  console.log('2. ABC Electronics: Company: ABC001 | Email: admin@abc.com | Pass: password123');
  console.log('3. Sri Lakshmi:     Company: SLT002 | Email: admin@lakshmi.com | Pass: password123');
  console.log('4. Kumar Distrib.:  Company: KUM003 | Email: admin@kumar.com | Pass: password123');
  console.log('-----------------------------------------------------------\n');
}

if (require.main === module) {
  seedDatabase()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Seeding failed:', err);
      process.exit(1);
    });
}

module.exports = { seedDatabase };
