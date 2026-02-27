#!/bin/bash

# Initial EC2 setup script
# Run this script once on your EC2 instance after launching it

set -e

echo "Setting up EC2 instance for FastAPI application..."

# Update system
sudo apt-get update
sudo apt-get upgrade -y

# Install required packages
sudo apt-get install -y \
    python3 \
    python3-pip \
    python3-venv \
    git \
    nginx

# Install and configure nginx (optional - for reverse proxy)
sudo tee /etc/nginx/sites-available/fastapi > /dev/null <<EOF
server {
    listen 80;
    server_name _;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF

# Enable nginx site
sudo ln -sf /etc/nginx/sites-available/fastapi /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx
sudo systemctl enable nginx

# Configure firewall (if ufw is enabled)
if command -v ufw &> /dev/null; then
    sudo ufw allow 22
    sudo ufw allow 80
    sudo ufw allow 8000
fi

echo "EC2 setup completed!"
echo "You can now deploy your application using the CI/CD pipeline or manually."

