#!/bin/bash
# ==============================================================================
# StockPilot SaaS — Free SSL / HTTPS Setup via Let's Encrypt (Certbot)
# Usage: sudo bash scripts/setup-ssl.sh [domain_name] [email]
# ==============================================================================
set -e

DOMAIN="${1:-stockpilot-ims.duckdns.org}"
EMAIL="${2:-yukeshyukesh785@gmail.com}"

# Strip protocol and slashes if user passed full URL
DOMAIN="${DOMAIN#http://}"
DOMAIN="${DOMAIN#https://}"
DOMAIN="${DOMAIN%/}"

echo "=========================================================="
echo "🔒 StockPilot SaaS — Configuring Free Let's Encrypt SSL"
echo "Domain: $DOMAIN"
echo "Email:  $EMAIL"
echo "=========================================================="

# 1. Install Certbot
echo "[1/3] Installing Certbot & Nginx plugin..."
sudo apt-get update -y
sudo apt-get install -y certbot python3-certbot-nginx

# 2. Update server_name in Nginx config
echo "[2/3] Configuring Nginx server_name for $DOMAIN..."
NGINX_CONF="/etc/nginx/sites-available/stockpilot"
if [ -f "$NGINX_CONF" ]; then
    sudo sed -i "s/server_name _;/server_name $DOMAIN;/g" "$NGINX_CONF"
    sudo nginx -t && sudo systemctl reload nginx
fi

# 3. Request and install SSL Certificate
echo "[3/3] Obtaining SSL Certificate & enabling HTTPS redirect..."
sudo certbot --nginx -d "$DOMAIN" --non-interactive --agree-tos -m "$EMAIL" --redirect

echo "=========================================================="
echo "🎉 SUCCESS: HTTPS SSL is now active!"
echo "Your StockPilot SaaS is fully secure (Lock 🔒 active):"
echo "   🛡️ Super Admin: https://$DOMAIN/admin/login"
echo "   🏢 Tenant Login: https://$DOMAIN/login"
echo "=========================================================="
