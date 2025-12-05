#!/bin/bash
set -e

# =============================================================================
# User Data Script for EC2 Instance
# Installs Node.js, Docker, and sets up the LaptopShop application
# =============================================================================

# Update system
yum update -y

# Install Docker
yum install -y docker
systemctl start docker
systemctl enable docker
usermod -a -G docker ec2-user

# Install Docker Compose
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# Install Node.js 18
curl -fsSL https://rpm.nodesource.com/setup_18.x | bash -
yum install -y nodejs

# Install Git
yum install -y git

# Create application directory
mkdir -p /home/ec2-user/app
chown ec2-user:ec2-user /home/ec2-user/app

# Create environment file
cat > /home/ec2-user/app/.env << 'EOF'
# Database Configuration
DATABASE_URL=mysql://${db_username}:${db_password}@${db_host}:3306/${db_name}

# AWS S3 Configuration
AWS_REGION=${aws_region}
AWS_S3_BUCKET_NAME=${s3_bucket_name}

# Application Configuration
NODE_ENV=production
PORT=${app_port}

# Session Secret (generate a secure random string)
SESSION_SECRET=$(openssl rand -hex 32)
EOF

chown ec2-user:ec2-user /home/ec2-user/app/.env
chmod 600 /home/ec2-user/app/.env

# Create a simple deployment script
cat > /home/ec2-user/deploy.sh << 'DEPLOY_EOF'
#!/bin/bash
cd /home/ec2-user/app

# Pull latest code (if using git)
# git pull origin main

# Install dependencies
npm ci --production

# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate deploy

# Build the application
npm run build

# Restart the application using PM2
npm install -g pm2
pm2 stop all || true
pm2 start dist/app.js --name laptopshop
pm2 save
pm2 startup
DEPLOY_EOF

chmod +x /home/ec2-user/deploy.sh
chown ec2-user:ec2-user /home/ec2-user/deploy.sh

# Install PM2 globally
npm install -g pm2

# Log completion
echo "EC2 instance setup completed at $(date)" >> /var/log/user-data.log
