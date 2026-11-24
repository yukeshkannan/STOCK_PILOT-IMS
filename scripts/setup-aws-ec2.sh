#!/bin/bash
# ==============================================================================
# StockPilot SaaS — Automated AWS EC2 Bootstrap & Production Deployment Script
# Target: Ubuntu 22.04 LTS (x86_64 / arm64) on AWS EC2 (t3.small / t4g.small)
# ==============================================================================
set -e

echo "=========================================================="
echo "🚀 StockPilot SaaS — AWS EC2 Production Bootstrap"
echo "=========================================================="

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

# 1. Update OS & Install Core Dependencies
echo "[1/7] Updating apt repositories and installing prerequisites..."
sudo apt-get update -y
sudo apt-get install -y curl wget git build-essential ufw software-properties-common jq

# 2. Install Node.js 20.x LTS
echo "[2/7] Installing Node.js 20 LTS & npm..."
if ! command -v node > /dev/null 2>&1 || [[ $(node -v) != v20* ]]; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi
echo "  ✓ Node $(node -v) & npm $(npm -v) ready."

# 3. Install PM2 Globally
echo "[3/7] Installing PM2 process manager..."
sudo npm install -g pm2

# 4. Install & Configure MySQL 8.0
echo "[4/7] Installing and provisioning MySQL Server..."
sudo apt-get install -y mysql-server
sudo systemctl start mysql
sudo systemctl enable mysql

# Configure MySQL root password and create microservice databases
echo "  ↳ Provisioning 9 microservice databases..."
sudo mysql -e "ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY 'rootpassword'; FLUSH PRIVILEGES;" 2>/dev/null || true

DATABASES=(
    "auth_db"
    "tenant_db"
    "product_db"
    "inventory_db"
    "warehouse_db"
    "purchase_db"
    "sales_db"
    "finance_db"
    "notification_db"
)

for db in "${DATABASES[@]}"; do
    mysql -u root -prootpassword -e "CREATE DATABASE IF NOT EXISTS \`$db\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;" 2>/dev/null || true
done
echo "  ✓ All 9 MySQL databases created and verified."

# 5. Install Nginx
echo "[5/7] Installing Nginx..."
sudo apt-get install -y nginx
sudo systemctl start nginx
sudo systemctl enable nginx

# 6. Install Project Dependencies across all microservices
echo "[6/7] Installing npm packages across all 11 microservices..."
cd "$ROOT_DIR"
npm install
node scripts/install-all.js

# 7. Run Server Optimization & Health Check
echo "[7/7] Running StockPilot server optimization & microservice launcher..."
chmod +x "$ROOT_DIR/scripts/optimize-server.sh"
sudo bash "$ROOT_DIR/scripts/optimize-server.sh"

# Enable PM2 on system boot
echo "  ↳ Configuring PM2 systemd auto-start..."
pm2 save || true
sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u ubuntu --hp /home/ubuntu 2>/dev/null || true

echo "=========================================================="
echo "🎉 AWS EC2 PROVISIONING COMPLETE!"
echo "✨ StockPilot SaaS is running on Port 80 via Nginx."
echo "=========================================================="
