#!/bin/bash

# Deployment script for EC2
# This script sets up the FastAPI application on EC2

set -e

echo "Starting deployment..."

# Update system packages
sudo apt-get update
sudo apt-get install -y python3 python3-pip python3-venv

# Create app directory
APP_DIR="/home/ubuntu/app"
mkdir -p $APP_DIR

# Create virtual environment
cd $APP_DIR
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install --upgrade pip
pip install -r requirements.txt

# Create systemd service file
sudo tee /etc/systemd/system/fastapi-app.service > /dev/null <<EOF
[Unit]
Description=FastAPI Application
After=network.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/home/ubuntu/app
Environment="PATH=/home/ubuntu/app/venv/bin"
ExecStart=/home/ubuntu/app/venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
EOF

# Reload systemd and start service
sudo systemctl daemon-reload
sudo systemctl enable fastapi-app
sudo systemctl start fastapi-app

echo "Deployment completed successfully!"
echo "Application is running on http://$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4):8000"

