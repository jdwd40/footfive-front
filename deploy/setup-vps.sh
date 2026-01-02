#!/bin/bash

# FootFive Frontend - VPS Setup Script
# Run this script on your VPS: bash setup-vps.sh

set -e

echo "🚀 Setting up FootFive Frontend deployment..."

# Create web directory
echo "📁 Creating web directory..."
sudo mkdir -p /var/www/jwd1.xyz
sudo chown -R $USER:$USER /var/www/jwd1.xyz

# Create a placeholder index.html
echo "📝 Creating placeholder..."
cat > /var/www/jwd1.xyz/index.html << 'EOF'
<!DOCTYPE html>
<html>
<head>
    <title>FootFive - Deploying...</title>
    <style>
        body { 
            font-family: system-ui; 
            display: flex; 
            justify-content: center; 
            align-items: center; 
            height: 100vh; 
            margin: 0;
            background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
            color: white;
        }
        .container { text-align: center; }
        h1 { font-size: 3rem; margin-bottom: 1rem; }
        p { font-size: 1.2rem; opacity: 0.8; }
    </style>
</head>
<body>
    <div class="container">
        <h1>⚽ FootFive</h1>
        <p>Deployment in progress... Push to GitHub to deploy!</p>
    </div>
</body>
</html>
EOF

# Install nginx if not present
if ! command -v nginx &> /dev/null; then
    echo "📦 Installing nginx..."
    sudo apt update
    sudo apt install -y nginx
fi

# Copy nginx config
echo "⚙️ Configuring nginx..."
sudo tee /etc/nginx/sites-available/jwd1.xyz > /dev/null << 'EOF'
server {
    listen 80;
    listen [::]:80;
    server_name jwd1.xyz www.jwd1.xyz;

    root /var/www/jwd1.xyz;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied expired no-cache no-store private auth;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml application/javascript;

    # Handle SPA routing - redirect all requests to index.html
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
}
EOF

# Enable site
echo "🔗 Enabling site..."
sudo ln -sf /etc/nginx/sites-available/jwd1.xyz /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default 2>/dev/null || true

# Test nginx config
echo "🧪 Testing nginx configuration..."
sudo nginx -t

# Restart nginx
echo "🔄 Restarting nginx..."
sudo systemctl restart nginx
sudo systemctl enable nginx

# Setup SSL with Let's Encrypt (optional but recommended)
echo ""
echo "🔒 Would you like to setup SSL with Let's Encrypt? (recommended)"
read -p "Install SSL certificate? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    if ! command -v certbot &> /dev/null; then
        echo "📦 Installing certbot..."
        sudo apt install -y certbot python3-certbot-nginx
    fi
    echo "🔐 Obtaining SSL certificate..."
    sudo certbot --nginx -d jwd1.xyz -d www.jwd1.xyz --non-interactive --agree-tos --email admin@jwd1.xyz || {
        echo "⚠️ SSL setup failed. You can run 'sudo certbot --nginx -d jwd1.xyz' manually later."
    }
fi

echo ""
echo "✅ VPS setup complete!"
echo ""
echo "🔧 Next steps:"
echo "1. Go to your GitHub repository settings"
echo "2. Navigate to Settings → Secrets and variables → Actions"
echo "3. Add these repository secrets:"
echo "   - VPS_HOST: 77.68.4.18"
echo "   - VPS_USER: jd"
echo "   - VPS_PASSWORD: (your SSH password)"
echo ""
echo "4. Push to your main/master branch to trigger deployment!"
echo ""
echo "🌐 Your site will be available at: https://jwd1.xyz"


