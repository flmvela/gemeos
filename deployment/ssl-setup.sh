#!/bin/bash

# SSL Setup Script for Gemeos
# Run this on your VM after DNS is configured

set -e

DOMAIN="www.gemeos.ai"
ALT_DOMAIN="gemeos.ai"

echo "🔐 Setting up SSL for $DOMAIN..."

# Check if domains resolve to this server
echo "🔍 Checking DNS resolution..."
CURRENT_IP=$(curl -s ifconfig.me)
DOMAIN_IP=$(dig +short $DOMAIN | tail -n1)

if [ "$CURRENT_IP" != "$DOMAIN_IP" ]; then
    echo "⚠️  Warning: $DOMAIN resolves to $DOMAIN_IP but this server is $CURRENT_IP"
    echo "   Make sure DNS is properly configured before proceeding."
    read -p "Continue anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Obtain SSL certificate
echo "📜 Obtaining SSL certificate..."
sudo certbot --nginx -d $DOMAIN -d $ALT_DOMAIN --non-interactive --agree-tos --email admin@$DOMAIN

# Set up auto-renewal
echo "🔄 Setting up auto-renewal..."
sudo systemctl enable certbot.timer
sudo systemctl start certbot.timer

# Test the renewal process
echo "🧪 Testing auto-renewal..."
sudo certbot renew --dry-run

echo "✅ SSL setup complete!"
echo "🔐 Certificate installed for $DOMAIN and $ALT_DOMAIN"
echo "🔄 Auto-renewal configured"
echo ""
echo "Your site should now be available at:"
echo "  https://$DOMAIN"
echo "  https://$ALT_DOMAIN"