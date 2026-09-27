# Gamesato Production Server & Architecture Guide

This document contains all critical architecture details, configuration parameters, environment templates, and operational rules for the Gamesato production infrastructure to prevent deployment mistakes or downtime.

---

## 1. Server Architecture & Port Map

| Component | Port | Directory | Process Name (PM2) | Tech Stack |
| :--- | :--- | :--- | :--- | :--- |
| **Frontend (Main)** | `3101` | `/root/apps/gamesato/frontend` | `gamesato-frontend-3101` | Next.js 16 (Turbopack) |
| **Backend (API)** | `3102` | `/root/apps/gamesato/backend` | `gamesato-backend-3102` | Node.js / Express / TypeScript |
| **Beta Frontend** | `3103` | `/root/apps/gamesato/beta` | `gamesato-beta-frontend-3103`| Next.js |
| **PostgreSQL** | `5432` | System Service (`postgres`) | System daemon | PostgreSQL 16 (User: `portal_admin`) |
| **Redis Cache** | `6379` | System Service (`redis-server`) | System daemon | Redis 7 |
| **Reverse Proxy** | `80, 443`| `/etc/nginx/sites-available/gamesato` | `nginx` | Nginx (Certbot SSL) |

---

## 2. Server Environment Paths & NVM

Node.js and PM2 are managed via **NVM (v24.12.0)** for user `root`. Always export the PATH when executing remote commands:

```bash
export PATH=/root/.nvm/versions/node/v24.12.0/bin:$PATH
```

- **Node binary**: `/root/.nvm/versions/node/v24.12.0/bin/node`
- **PM2 binary**: `/root/.nvm/versions/node/v24.12.0/bin/pm2`
- **NPM binary**: `/root/.nvm/versions/node/v24.12.0/bin/npm`

---

## 3. Environment Variables (CRITICAL)

> [!CAUTION]
> **NEVER OVERWRITE SERVER ENV FILES FROM LOCAL DEV MACHINE!**
> Local development machines use local user credentials (e.g. `pushpaindunath` without password).
> The production server **requires** the `portal_admin` user with SCRAM authentication. Overwriting server `.env` will cause immediate database connection failure (`client password must be a string`) and show "No Games Found".

### A. Frontend Environment (`/root/apps/gamesato/frontend/.env.local`)

```env
# Database and Caching
DATABASE_URL="postgresql://portal_admin:PortalSecure%40321@localhost:5432/gamesato?schema=public"
REDIS_URL="redis://127.0.0.1:6379"

# NextAuth Configuration
NEXTAUTH_URL="https://gamesato.com"
NEXTAUTH_SECRET="gamesato_session_signing_secret_key_32_chars_long_minimum_value"

# Site & Backend URLs
NEXT_PUBLIC_SITE_URL="https://gamesato.com"
NEXT_PUBLIC_BACKEND_URL="https://api.gamesato.com"

# OAuth Providers
GOOGLE_CLIENT_ID="<YOUR_GOOGLE_CLIENT_ID>"
GOOGLE_CLIENT_SECRET="<YOUR_GOOGLE_CLIENT_SECRET>"

FACEBOOK_CLIENT_ID="<YOUR_FACEBOOK_CLIENT_ID>"
FACEBOOK_CLIENT_SECRET="<YOUR_FACEBOOK_CLIENT_SECRET>"

DISCORD_CLIENT_ID="<YOUR_DISCORD_CLIENT_ID>"
DISCORD_CLIENT_SECRET="<YOUR_DISCORD_CLIENT_SECRET>"
```

### B. Backend Environment (`/root/apps/gamesato/backend/.env`)

```env
PORT=3102
DATABASE_URL="postgresql://portal_admin:PortalSecure@321@localhost:5432/gamesato?schema=public"
REDIS_URL="redis://127.0.0.1:6379"
JWT_SECRET="gamesato_prod_secret_key_2026!"
NEXTAUTH_SECRET="gamesato_nextauth_secret_key_2026!"
UPLOADS_DIR="./uploads"
GAMES_DIR="./gb-games"
FRONTEND_URL="https://gamesato.com"
```

---

## 4. Safe Deployment Workflow

When syncing files from local development to the production server:

### Step 1: ALWAYS exclude `.env*` files

```bash
# Example rsync for frontend:
rsync -avz --exclude='.env*' --exclude='.next' --exclude='node_modules' frontend/ root@72.61.169.18:/root/apps/gamesato/frontend/

# Example rsync for backend:
rsync -avz --exclude='.env*' --exclude='dist' --exclude='node_modules' --exclude='uploads' backend/ root@72.61.169.18:/root/apps/gamesato/backend/
```

### Step 2: Rebuilding Frontend on Server

```bash
ssh root@72.61.169.18 "export PATH=/root/.nvm/versions/node/v24.12.0/bin:\$PATH; cd /root/apps/gamesato/frontend && npm run build && pm2 restart gamesato-frontend-3101 --update-env"
```

### Step 3: Rebuilding Backend on Server

```bash
ssh root@72.61.169.18 "export PATH=/root/.nvm/versions/node/v24.12.0/bin:\$PATH; cd /root/apps/gamesato/backend && npm run build && pm2 restart gamesato-backend-3102 --update-env"
```

---

## 5. Nginx & Static Assets Routing

- **Configuration File**: `/etc/nginx/sites-available/gamesato`
- **Uploads Handling**: Nginx directly serves all media and thumbnails via alias:
  ```nginx
  location /uploads/ {
      alias /root/apps/gamesato/backend/uploads/;
      expires 30d;
      add_header Cache-Control "public, max-age=2592000, immutable";
      add_header Access-Control-Allow-Origin "*";
      try_files $uri =404;
  }
  ```
- **Thumbnails Format**: All thumbnails are converted to high-quality `.webp` to save bandwidth and maximize LCP performance.

---

## 6. PM2 Process Health & Diagnostics

```bash
# Check running services
export PATH=/root/.nvm/versions/node/v24.12.0/bin:$PATH
pm2 status

# Check frontend logs
pm2 logs gamesato-frontend-3101 --lines 50 --nostream

# Check backend logs
pm2 logs gamesato-backend-3102 --lines 50 --nostream

# Restart all Gamesato processes
pm2 restart gamesato-frontend-3101 gamesato-backend-3102 --update-env
```

---

## 7. Emergency Recovery Checklist

If "No Games Found" or 500 errors appear:
1. Verify `/root/apps/gamesato/frontend/.env.local` contains `portal_admin:PortalSecure%40321`.
2. Check Postgres status: `systemctl status postgresql`.
3. Check Redis status: `systemctl status redis-server`.
4. Flush & inspect PM2 error logs: `pm2 logs gamesato-frontend-3101 --err --lines 50`.
5. Restore from backup if needed: `cp /root/apps/gamesato/frontend/.env.local.backup /root/apps/gamesato/frontend/.env.local`.
