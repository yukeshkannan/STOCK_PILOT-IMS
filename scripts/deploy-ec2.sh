#!/bin/bash
# StockPilot IMS - Automated AWS EC2 Server Setup Script
set -e

echo "=========================================="
echo "🚀 StockPilot IMS - Server Setup & Launch"
echo "=========================================="

# 1. Update system
echo "📦 Updating system packages..."
sudo apt-get update && sudo apt-get upgrade -y

# 2. Install Docker & Docker Compose
echo "🐳 Installing Docker & Docker Compose..."
sudo apt-get install -y ca-certificates curl gnupg lsb-release git

sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg

echo \
  "deb [arch="$(dpkg --print-architecture)" signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  "$(. /etc/os-release && echo "$VERSION_CODENAME")" stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

sudo usermod -aG docker $USER

# 3. Create .env if not exists
if [ ! -f .env ]; then
  echo "⚙️ Creating production .env file..."
  cat <<EOT >> .env
PORT=5000
NODE_ENV=production
DB_ROOT_PASSWORD=rootpassword
JWT_SECRET=stockpilot_jwt_prod_secret_key_2026
JWT_REFRESH_SECRET=stockpilot_jwt_refresh_prod_secret_key_2026
EOT
fi

# 4. Build and run backend microservices
echo "🚀 Starting StockPilot Backend Microservices with Docker..."
sudo docker compose -f docker-compose.prod.yml up -d --build

echo "=========================================="
echo "✅ StockPilot Backend is running successfully!"
echo "📡 Test API Gateway Health: curl http://localhost:5000/health"
echo "=========================================="
