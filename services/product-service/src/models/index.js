const { DataTypes } = require('sequelize');
const { createDatabaseConnection } = require('@stockpilot/common');

const sequelize = createDatabaseConnection(process.env.DB_NAME || 'product_db');

const Category = sequelize.define('Category', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  tenant_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  code: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  description: {
    type: DataTypes.STRING(255),
    allowNull: true
  }
}, {
  tableName: 'categories',
  timestamps: true,
  underscored: true,
  indexes: [
    {
      unique: true,
      fields: ['tenant_id', 'name']
    }
  ]
});

const Brand = sequelize.define('Brand', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  tenant_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  description: {
    type: DataTypes.STRING(255),
    allowNull: true
  }
}, {
  tableName: 'brands',
  timestamps: true,
  underscored: true,
  indexes: [
    {
      unique: true,
      fields: ['tenant_id', 'name']
    }
  ]
});

const Product = sequelize.define('Product', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  tenant_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  product_code: {
    type: DataTypes.STRING(60),
    allowNull: false
  },
  name: {
    type: DataTypes.STRING(200),
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  category_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  brand_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  unit: {
    type: DataTypes.STRING(30),
    defaultValue: 'PCS'
  },
  purchase_price: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    defaultValue: 0.00
  },
  selling_price: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    defaultValue: 0.00
  },
  tax_rate: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 18.00 // standard GST %
  },
  minimum_stock: {
    type: DataTypes.INTEGER,
    defaultValue: 5
  },
  maximum_stock: {
    type: DataTypes.INTEGER,
    defaultValue: 1000
  },
  image_url: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('ACTIVE', 'INACTIVE', 'DISCONTINUED'),
    defaultValue: 'ACTIVE'
  }
}, {
  tableName: 'products',
  timestamps: true,
  underscored: true,
  indexes: [
    {
      unique: true,
      fields: ['tenant_id', 'product_code']
    }
  ]
});

Product.belongsTo(Category, { foreignKey: 'category_id', as: 'category' });
Product.belongsTo(Brand, { foreignKey: 'brand_id', as: 'brand' });
Category.hasMany(Product, { foreignKey: 'category_id', as: 'products' });
Brand.hasMany(Product, { foreignKey: 'brand_id', as: 'products' });

module.exports = {
  sequelize,
  Category,
  Brand,
  Product
};
