#!/bin/bash

# VM Setup Script for Gemeos Deployment
# Run this script on your Google VM (35.224.214.108)

set -e

echo "🚀 Setting up VM for Gemeos deployment..."

# Update system
echo "📦 Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install Node.js 20
echo "📦 Installing Node.js..."
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install nginx
echo "📦 Installing nginx..."
sudo apt install -y nginx

# Install certbot for SSL
echo "📦 Installing certbot..."
sudo apt install -y certbot python3-certbot-nginx

# Create web directory
echo "📁 Creating web directory..."
sudo mkdir -p /var/www/gemeos
sudo chown -R $USER:$USER /var/www/gemeos

# Configure firewall
echo "🔥 Configuring firewall..."
sudo ufw allow 'Nginx Full'
sudo ufw allow OpenSSH
sudo ufw --force enable

# Create nginx configuration
echo "⚙️  Creating nginx configuration..."
sudo tee /etc/nginx/sites-available/gemeos <<EOF
server {
    listen 80;
    server_name www.gemeos.ai gemeos.ai;
    
    root /var/www/gemeos;
    index index.html;
    
    # Handle client-side routing for SPA
    location / {
        try_files \$uri \$uri/ /index.html;
    }
    
    # Optimize static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, no-transform";
    }
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
}
EOF

# Enable the site
sudo ln -sf /etc/nginx/sites-available/gemeos /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Test nginx configuration
sudo nginx -t

# Start and enable nginx
sudo systemctl start nginx
sudo systemctl enable nginx

echo "✅ VM setup complete!"
echo ""
echo "Next steps:"
echo "1. Point www.gemeos.ai DNS to 35.224.214.108"
echo "2. Run SSL setup: sudo certbot --nginx -d www.gemeos.ai -d gemeos.ai"
echo "3. Deploy your application files to /var/www/gemeos"