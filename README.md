# Spotify Now Playing

**English** | **[日本語](./README-ja.md)** | **[English for Vercel](./README-for-vercel.md)** | **[Vercel用日本語](./README-for-vercel-ja.md)**

A web application that displays your current Spotify track with a beautiful UI. It includes a PWA-enabled Admin panel for playback control, Discord notifications, and Twitter sharing integration.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
  - [1. Spotify Developer Setup](#1-spotify-developer-setup)
  - [2. Environment Variables](#2-environment-variables)
  - [3. Obtaining the Refresh Token](#3-obtaining-the-refresh-token)
- [Development](#development)
- [Production Deployment](#production-deployment)
  - [Build](#build)
  - [Process Management (PM2)](#process-management-pm2)
  - [Reverse Proxy (Nginx) & SSL](#reverse-proxy-nginx--ssl)
- [Usage](#usage)

---

## Prerequisites

- **Node.js** (v16 or higher recommended)
- **npm** (Node Package Manager)
- A **Spotify Developer** account
- A server/VPS for production (optional)

---

## Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/otoneko1102/SpotifyNowPlaying.git
   cd spotifynowplaying
   ```

2. **Install Backend Dependencies:**
   ```bash
   npm install
   ```

3. **Install Frontend Dependencies:**
   ```bash
   cd frontend
   npm install
   cd ..
   ```

---

## Configuration

### 1. Spotify Developer Setup

1. Go to the [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Create a new App
3. Note down the **Client ID** and **Client Secret**
4. In the App settings, add the following Redirect URI:
   ```
   http://127.0.0.1:3000/callback
   ```
   > [!NOTE]
   > This local address is used for the initial token generation script.

### 2. Environment Variables

Create a `.env` file in the root directory:

```bash
touch .env
```

Add the following content to `.env`:

```env
PORT=3333
SPOTIFY_CLIENT_ID="your_spotify_client_id"
SPOTIFY_CLIENT_SECRET="your_spotify_client_secret"
SPOTIFY_REFRESH_TOKEN=""  # Leave empty for now, see Step 3
ADMIN_PASSWORD="set_your_secure_password"
DISCORD_WEBHOOK_URL="your_discord_webhook_url"  # Optional
```

### 3. Obtaining the Refresh Token

Since Spotify requires a one-time user authorization to access your playback state, you need to generate a Refresh Token.

1. **Run the setup script:**
   ```bash
   npx ts-node src/setup-token.ts
   ```

2. **Follow the instructions in the terminal:**
   - Copy the generated URL and open it in your local browser
   - Log in to Spotify and authorize the app
   - You will be redirected to a page that may fail to load (e.g., `http://127.0.0.1:3000/callback...`). This is normal.
   - Copy the entire URL from your browser's address bar
   - Paste the URL back into the terminal prompt and press Enter
   - The script will output your `SPOTIFY_REFRESH_TOKEN`

3. **Update your `.env` file** with the generated token.

---

## Development

To run the project locally with hot-reloading:

```bash
npm run dev
```

- **Frontend:** http://localhost:3333 (Proxied via Vite/Express)
- **Admin Panel:** http://localhost:3333/admin

---

## Production Deployment

### Build

Compile the TypeScript backend and build the Svelte frontend:

```bash
npm run build
```

This will create a `dist` folder for the server and build the frontend assets into `public`.

### Process Management (PM2)

Use PM2 to keep the application running in the background.

1. **Install PM2 globally (if not installed):**
   ```bash
   sudo npm install -g pm2
   ```

2. **Start the application:**
   ```bash
   pm2 start ecosystem.config.js
   pm2 save
   pm2 startup
   ```

### Reverse Proxy (Nginx) & SSL

To serve the app via a domain (e.g., `spotify.example.org`) with HTTPS.

1. **Install Nginx:**
   ```bash
   sudo apt update
   sudo apt install nginx
   ```

2. **Configure Nginx:**
   Create a config file at `/etc/nginx/sites-available/spotify.example.org`:
   ```nginx
   server {
       listen 80;
       server_name spotify.example.org;

       location / {
           proxy_pass http://127.0.0.1:3333;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
       }
   }
   ```

3. **Enable Site & Restart Nginx:**
   ```bash
   sudo ln -s /etc/nginx/sites-available/spotify.example.org /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl restart nginx
   ```

4. **Setup SSL (Certbot):**
   ```bash
   sudo apt install certbot python3-certbot-nginx
   sudo certbot --nginx -d spotify.example.org
   ```

---

## Usage

### Public View

- **URL:** https://spotify.example.org/
- **Features:** Read-only view of the currently playing track. No controls available.

### Admin View (PWA)

- **URL:** https://spotify.example.org/admin
- **Features:** Full playback controls (Play, Pause, Skip), Tweet button.
- **Access:** Requires the password set in `ADMIN_PASSWORD`.
- **PWA:** Can be installed as a standalone app on mobile devices.
