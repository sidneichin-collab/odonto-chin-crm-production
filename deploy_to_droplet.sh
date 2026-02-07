#!/bin/bash
set -e

echo "=== Installing PM2 and pnpm globally ==="
ssh -i /home/ubuntu/.ssh/odonto_droplet root@178.128.4.51 'npm install -g pm2 pnpm'

echo "=== Installing system dependencies ==="
ssh -i /home/ubuntu/.ssh/odonto_droplet root@178.128.4.51 'apt-get install -y postgresql-client nginx git certbot python3-certbot-nginx'

echo "=== Verifying installations ==="
ssh -i /home/ubuntu/.ssh/odonto_droplet root@178.128.4.51 'node --version && npm --version && pnpm --version && pm2 --version && nginx -v 2>&1 && git --version && certbot --version'

echo "=== All dependencies installed successfully! ==="
