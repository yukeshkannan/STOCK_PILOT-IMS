#!/bin/bash
# ==============================================================================
# StockPilot SaaS — Pure Production Initialization Script (Option A)
# ==============================================================================
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

echo "=========================================================="
echo "🚀 StockPilot SaaS — Clean Production Initialization"
echo "=========================================================="

# 1. Configure MySQL users & databases via local root socket
echo "[1/4] Configuring MySQL root & 127.0.0.1 permissions..."
sudo mysql << 'SQLEOF'
ALTER USER 'root'@'localhost' IDENTIFIED BY 'rootpassword';
CREATE USER IF NOT EXISTS 'root'@'127.0.0.1' IDENTIFIED BY 'rootpassword';
ALTER USER 'root'@'127.0.0.1' IDENTIFIED BY 'rootpassword';
GRANT ALL PRIVILEGES ON *.* TO 'root'@'localhost' WITH GRANT OPTION;
GRANT ALL PRIVILEGES ON *.* TO 'root'@'127.0.0.1' WITH GRANT OPTION;

CREATE DATABASE IF NOT EXISTS `auth_db` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE IF NOT EXISTS `tenant_db` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE IF NOT EXISTS `product_db` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE IF NOT EXISTS `inventory_db` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE IF NOT EXISTS `warehouse_db` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE IF NOT EXISTS `purchase_db` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE IF NOT EXISTS `sales_db` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE IF NOT EXISTS `finance_db` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE IF NOT EXISTS `notification_db` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
FLUSH PRIVILEGES;
SQLEOF
echo "  ✓ MySQL root & 127.0.0.1 authorized with rootpassword."
echo "  ✓ All 9 microservice databases created."

# 2. Run Pure Production Database Initialization (Option A)
echo "[2/4] Synchronizing schemas & provisioning SuperAdmin (Zero dummy data)..."
cd "$ROOT_DIR"
node scripts/init-production-db.js

# 3. Restart PM2 microservices with clean env
echo "[3/4] Restarting microservices..."
pm2 restart all --update-env
echo "  ✓ PM2 processes reloaded."

# 4. Verify Health
echo "[4/4] Verifying health of all ports..."
sleep 4
echo "----------------------------------------------------------"
printf "%-8s %-25s %-10s\n" "PORT" "SERVICE" "STATUS"
echo "----------------------------------------------------------"

declare -A SERVICES_MAP=(
    ["5000"]="API Gateway"
    ["5001"]="Auth Service"
    ["5002"]="Tenant & User Service"
    ["5003"]="Product Catalog"
    ["5004"]="Core Inventory"
    ["5005"]="Warehouse & Transfer"
    ["5006"]="Supplier & Purchase"
    ["5007"]="Customer & Sales"
    ["5008"]="Finance & Analytics"
    ["5009"]="Notification Service"
    ["5010"]="AI Copilot Service"
)

ALL_HEALTHY=true
for port in 5000 5001 5002 5003 5004 5005 5006 5007 5008 5009 5010; do
    NAME="${SERVICES_MAP[$port]}"
    RESPONSE=$(curl -s -m 2 "http://127.0.0.1:$port/health" 2>/dev/null || true)
    if [[ "$RESPONSE" =~ "UP" ]]; then
        printf "%-8s %-25s \e[32m[ UP ]\e[0m\n" "$port" "$NAME"
    else
        printf "%-8s %-25s \e[31m[ DOWN ]\e[0m\n" "$port" "$NAME"
        ALL_HEALTHY=false
    fi
done

echo "----------------------------------------------------------"
if [ "$ALL_HEALTHY" = true ]; then
    echo "🎉 PURE PRODUCTION ENVIRONMENT IS LIVE & 100% HEALTHY!"
    echo "✨ Super Admin Login: http://54.163.30.152/admin/login"
    echo "✨ Email: superadmin@stockpilot.io | Password: adminpassword123"
else
    echo "⚠️ Check 'pm2 logs --err --lines 20 --nostream'."
fi
echo "=========================================================="
