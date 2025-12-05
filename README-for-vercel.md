# Spotify Now Playing (Vercel Deployment)

**[English](./README.md)** | **[日本語](./README-ja.md)** | **English for Vercel** | **[Vercel用日本語](./README-for-vercel-ja.md)**

This is the Vercel-compatible version of the **Spotify Now Playing** web application. It runs on Vercel's Serverless Functions (Hobby Plan compatible), allowing you to host it for free.

> [!WARNING]
> Due to the serverless nature of Vercel, the **Discord Notification feature (background polling) is disabled** and will not work. Only the Web UI and Admin Controller are available.

## Table of Contents

- [Prerequisites](#prerequisites)
- [1. Local Setup (For Token Generation)](#1-local-setup-for-token-generation)
- [2. Spotify Developer Setup](#2-spotify-developer-setup)
- [3. Obtain Refresh Token](#3-obtain-refresh-token)
- [4. Deploy to Vercel](#4-deploy-to-vercel)
- [Usage](#usage)

---

## Prerequisites

- A **GitHub** account
- A **Vercel** account
- A **Spotify Developer** account
- **Node.js** (installed locally on your machine)

---

## 1. Local Setup (For Token Generation)

You need to run the project locally **once** to generate the Spotify Refresh Token. You cannot generate this token directly on Vercel.

1. **Clone the repository:**
   git clone https://github.com/otoneko1102/SpotifyNowPlaying.git
   cd spotifynowplaying

2. **Install Dependencies:**
   npm install

---

## 2. Spotify Developer Setup

1. Go to the Spotify Developer Dashboard (https://developer.spotify.com/dashboard/)
2. Create a new App
3. Note down the **Client ID** and **Client Secret**
4. In the App settings, add the following Redirect URI:
   http://127.0.0.1:3000/callback

   > [!NOTE]
   > This is required for the local token generation script.

---

## 3. Obtain Refresh Token

Run the setup script on your **local machine**:

1. **Create a temporary .env file** (optional, but helps with the script):
   SPOTIFY_CLIENT_ID="your_client_id"
   SPOTIFY_CLIENT_SECRET="your_client_secret"

2. **Run the script:**
   npx ts-node src/setup-token.ts

3. **Follow the instructions:**
   - Open the generated URL in your browser.
   - Authorize the app.
   - Copy the URL you are redirected to (even if it shows an error page).
   - Paste it back into the terminal.
   - **Save the SPOTIFY_REFRESH_TOKEN output.** You will need this for Vercel.

---

## 4. Deploy to Vercel

1. **Push your code to GitHub.**

2. **Log in to Vercel** and click **"Add New..."** -> **"Project"**.

3. **Import your repository.**

4. **Configure Project:**
   - **Framework Preset:** Vite
   - **Root Directory:** ./
   - **Build Command:** npm run build
   - **Output Directory:** public

5. **Environment Variables:**
   Add the following variables in the Vercel dashboard:

   Name                   | Value                | Description
   -----------------------|----------------------|---------------------------------------
   VERCEL                 | 1                    | **Required.** Enables serverless mode.
   SPOTIFY_CLIENT_ID      | (Your Client ID)     | From Spotify Dashboard.
   SPOTIFY_CLIENT_SECRET  | (Your Secret)        | From Spotify Dashboard.
   SPOTIFY_REFRESH_TOKEN  | (Your Token)         | The token you generated in Step 3.
   ADMIN_PASSWORD         | (Your Password)      | Password to access the /admin page.

   > [!CAUTION]
   > Do not add DISCORD_WEBHOOK_URL as it is not supported on Vercel.

6. Click **Deploy**.

---

## Usage

Once deployed, visit your Vercel URL (e.g., https://your-project.vercel.app).

### Public View
- **URL:** https://your-project.vercel.app/
- **Features:** Shows the currently playing song on Spotify.

### Admin View
- **URL:** https://your-project.vercel.app/admin
- **Features:** Playback controls (Play, Pause, Skip) and Tweet button.
- **Access:** Requires the ADMIN_PASSWORD.
