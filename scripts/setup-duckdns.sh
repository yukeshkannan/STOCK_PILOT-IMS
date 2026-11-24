#!/bin/bash
# ==============================================================================
# StockPilot SaaS — Free Dynamic DNS Setup via DuckDNS (Zero Elastic IP Cost)
# Usage: sudo bash scripts/setup-duckdns.sh <domain_name> <token>
# Example: sudo bash scripts/setup-duckdns.sh stockpilot a1b2c3d4-e5f6-7890-...
# ==============================================================================
set -e

DOMAIN="$1"
TOKEN="$2"

if [ -z "$DOMAIN" ] || [ -z "$TOKEN" ]; then
    echo "Usage: sudo bash scripts/setup-duckdns.sh <domain_name> <token>"
    echo "Example: sudo bash scripts/setup-duckdns.sh stockpilot 12345678-xxxx-xxxx"
    exit 1
fi

# Strip .duckdns.org if user typed full domain
DOMAIN="${DOMAIN%.duckdns.org}"

echo "=========================================================="
echo "🦆 Configuring DuckDNS for [$DOMAIN.duckdns.org]..."
echo "=========================================================="

sudo mkdir -p /opt/duckdns
cat << EOF | sudo tee /opt/duckdns/duck.sh > /dev/null
#!/bin/bash
echo url="https://www.duckdns.org/update?domains=${DOMAIN}&token=${TOKEN}&ip=" | curl -k -s -o /var/log/duckdns.log -K -
EOF

sudo chmod 700 /opt/duckdns/duck.sh

# Run once immediately
/opt/duckdns/duck.sh
STATUS=$(cat /var/log/duckdns.log)

if [ "$STATUS" = "OK" ]; then
    echo "  ✓ IP successfully updated on DuckDNS! Status: OK"
else
    echo "  ⚠️ DuckDNS response: $STATUS (Please verify your token & domain name)"
fi

# Configure Crontab to auto-update on boot and every 5 minutes
CRON_JOB="*/5 * * * * /opt/duckdns/duck.sh >/dev/null 2>&1
@reboot /opt/duckdns/duck.sh >/dev/null 2>&1"

(crontab -l 2>/dev/null | grep -v "/opt/duckdns/duck.sh" ; echo "$CRON_JOB") | crontab -

echo "  ✓ Cron job registered: updates on boot & every 5 minutes."
echo "🎉 Setup complete! You can now access StockPilot at:"
echo "   http://${DOMAIN}.duckdns.org"
echo "=========================================================="
