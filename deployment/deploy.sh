#!/bin/bash

# Deployment Script for Gemeos
# Builds the project and deploys to Google VM

set -e

VM_IP="35.224.214.108"
VM_USER="$1"  # Pass your VM username as first argument
DOMAIN="www.gemeos.ai"

if [ -z "$VM_USER" ]; then
    echo "❌ Usage: ./deploy.sh <vm-username>"
    echo "   Example: ./deploy.sh your-username"
    exit 1
fi

echo "🚀 Starting deployment to $DOMAIN ($VM_IP)..."

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "❌ .env file not found! Please create it with your production environment variables."
    echo "   Copy .env.example to .env and fill in your values."
    exit 1
fi

# Build the project
echo "🔨 Building project..."
npm run build

# Check if build succeeded
if [ ! -d "dist" ]; then
    echo "❌ Build failed! dist directory not found."
    exit 1
fi

echo "📦 Build successful! Deploying to VM..."

# Create deployment archive
echo "📁 Creating deployment archive..."
tar -czf deployment.tar.gz -C dist .

# Copy files to VM
echo "📤 Uploading files to VM..."
scp deployment.tar.gz $VM_USER@$VM_IP:/tmp/

# Extract and deploy on VM
echo "🎯 Extracting files on VM..."
ssh $VM_USER@$VM_IP << 'EOF'
    # Backup existing deployment
    sudo mkdir -p /var/backups/gemeos
    if [ -d "/var/www/gemeos" ] && [ "$(ls -A /var/www/gemeos 2>/dev/null)" ]; then
        sudo tar -czf /var/backups/gemeos/backup-$(date +%Y%m%d-%H%M%S).tar.gz -C /var/www/gemeos .
    fi
    
    # Clear current deployment
    sudo rm -rf /var/www/gemeos/*
    
    # Extract new deployment
    cd /var/www/gemeos
    sudo tar -xzf /tmp/deployment.tar.gz
    sudo chown -R www-data:www-data /var/www/gemeos
    
    # Cleanup
    rm /tmp/deployment.tar.gz
    
    # Reload nginx
    sudo systemctl reload nginx
    
    echo "✅ Deployment complete!"
EOF

# Cleanup local files
rm deployment.tar.gz

echo "🎉 Deployment successful!"
echo "🌐 Your site should be available at: https://$DOMAIN"
echo ""
echo "To check status:"
echo "  ssh $VM_USER@$VM_IP 'sudo systemctl status nginx'"
echo "  ssh $VM_USER@$VM_IP 'sudo nginx -t'"