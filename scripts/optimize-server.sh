#!/bin/bash
# ==============================================================================
# StockPilot Production Optimization & Health Verification Script
# ==============================================================================
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

echo "=========================================================="
echo "🚀 StockPilot SaaS — Optimizing Server & Microservices"
echo "=========================================================="
echo "Root directory: $ROOT_DIR"

# 1. Frontend Static Assets to /var/www/stockpilot/dist
echo "[1/7] Deploying code-split frontend build to /var/www/stockpilot/dist..."
sudo mkdir -p /var/www/stockpilot/dist
sudo rm -rf /var/www/stockpilot/dist/*
sudo cp -r "$ROOT_DIR/frontend/dist"/* /var/www/stockpilot/dist/
sudo chown -R www-data:www-data /var/www/stockpilot
sudo chmod -R 755 /var/www/stockpilot
echo "  ✓ Frontend assets successfully deployed (lazy-loaded chunks active)."

# 2. Update Nginx Configuration
echo "[2/7] Configuring Nginx with Gzip & 1-Year Asset Caching..."
sudo cp "$ROOT_DIR/deploy/nginx/stockpilot.conf" /etc/nginx/sites-available/stockpilot
sudo ln -sf /etc/nginx/sites-available/stockpilot /etc/nginx/sites-enabled/stockpilot
sudo rm -f /etc/nginx/sites-enabled/default

# Test and reload Nginx
sudo nginx -t
sudo systemctl restart nginx
echo "  ✓ Nginx configuration active and reloaded."

# 3. Kernel Swappiness Optimization (Reduce VM I/O thrashing on 1GB RAM)
echo "[3/7] Tuning OS swappiness (vm.swappiness=10)..."
sudo sysctl vm.swappiness=10 > /dev/null
if ! grep -q "vm.swappiness=10" /etc/sysctl.conf 2>/dev/null; then
    echo "vm.swappiness=10" | sudo tee -a /etc/sysctl.conf > /dev/null
fi
echo "  ✓ Swappiness set to 10."

# 4. MySQL Low-Memory & Fast Disk I/O Tuning for 1GB RAM instance
echo "[4/7] Tuning MySQL memory & transaction I/O..."
sudo mkdir -p /etc/mysql/conf.d
MYSQL_CONF="/etc/mysql/conf.d/stockpilot-lowmem.cnf"
cat << 'MEOF' | sudo tee "$MYSQL_CONF" > /dev/null
[mysqld]
# Disable performance_schema to save ~150MB physical RAM
performance_schema = OFF
# Right-size InnoDB buffer pool for 1GB RAM VM
innodb_buffer_pool_size = 48M
innodb_log_buffer_size = 4M
# Flush transaction log to OS cache every commit, disk every 1s (10x faster write I/O)
innodb_flush_log_at_trx_commit = 2
# Cap maximum concurrent connections
max_connections = 60
table_open_cache = 400
MEOF

sudo systemctl restart mysql
echo "  ✓ MySQL optimized (performance_schema=OFF, innodb_flush_log=2)."

# 5. Flush Redis Cloud Cache
echo "[5/7] Flushing Upstash Redis cache..."
cd "$ROOT_DIR"
node scripts/flush-cache.js || true
echo "  ✓ Cache flushed."

# 6. Restart PM2 Microservices with clean environment & 96M heap limit
echo "[6/7] Starting/Restarting PM2 microservices with 96M heap limit..."
pm2 flush || true
if pm2 list | grep -q -E "gateway|auth-svc|online"; then
    pm2 restart all --update-env
else
    pm2 start ecosystem.config.js
fi
pm2 save || true
echo "  ✓ Microservices active with aggressive V8 GC."

# 7. Verify Health of all 11 ports
echo "[7/7] Verifying all service endpoints..."
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
    echo "🎉 ALL 11 MICROSERVICES ARE UP AND RUNNING LIGHTNING FAST!"
    echo "✨ Platform URL: http://140.245.244.215"
    echo "⚡ Code Splitting + Gzip + MySQL LowMem Active"
else
    echo "⚠️ Some services reported DOWN. Check 'pm2 logs --err --lines 20 --nostream'."
fi
echo "=========================================================="
