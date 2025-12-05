# Use Node.js 18 slim (Debian-based) for better compatibility
FROM node:18-slim

# Install dependencies for native modules and OpenSSL for Prisma
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Install all dependencies
RUN npm ci

# Copy source code
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build TypeScript
RUN npm run build

# Don't run as root
RUN groupadd --system --gid 1001 nodejs
RUN useradd --system --uid 1001 -g nodejs nodejs

# Change ownership of the app directory
RUN chown -R nodejs:nodejs /app

USER nodejs

EXPOSE 3000

ENV NODE_ENV=production

# Run migrations and start the app
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/app.js"]