# Spotify Now Playing

[English](./README.md) | **日本語**

現在再生中のSpotifyトラックを美しいUIで表示するWebアプリケーションです。再生コントロール、Discord通知、Twitter共有機能を備えたPWA対応の管理画面が含まれています。

## 目次

- [前提条件](#前提条件)
- [インストール](#インストール)
- [設定](#設定)
  - [1. Spotify Developer セットアップ](#1-spotify-developer-セットアップ)
  - [2. 環境変数](#2-環境変数)
  - [3. リフレッシュトークンの取得](#3-リフレッシュトークンの取得)
- [開発](#開発)
- [本番環境へのデプロイ](#本番環境へのデプロイ)
  - [ビルド](#ビルド)
  - [プロセス管理 (PM2)](#プロセス管理-pm2)
  - [リバースプロキシ (Nginx) & SSL](#リバースプロキシ-nginx--ssl)
- [使い方](#使い方)

---

## 前提条件

- **Node.js** (v16以上を推奨)
- **npm** (Node Package Manager)
- **Spotify Developer** アカウント
- 本番環境用のサーバー/VPS (オプション)

---

## インストール

1. **リポジトリをクローン:**
   ```bash
   git clone https://github.com/otoneko1102/SpotifyNowPlaying.git
   cd spotifynowplaying
   ```

2. **バックエンドの依存関係をインストール:**
   ```bash
   npm install
   ```

3. **フロントエンドの依存関係をインストール:**
   ```bash
   cd frontend
   npm install
   cd ..
   ```

---

## 設定

### 1. Spotify Developer セットアップ

1. [Spotify Developer Dashboard](https://developer.spotify.com/dashboard) にアクセス
2. 新しいアプリを作成
3. **Client ID** と **Client Secret** をメモ
4. アプリ設定で、以下のリダイレクトURIを追加:
   ```
   http://127.0.0.1:3000/callback
   ```
   > 注意: このローカルアドレスは、初回のトークン生成スクリプトで使用されます。

### 2. 環境変数

ルートディレクトリに `.env` ファイルを作成:

```bash
touch .env
```

`.env` に以下の内容を追加:

```env
PORT=3333
SPOTIFY_CLIENT_ID="your_spotify_client_id"
SPOTIFY_CLIENT_SECRET="your_spotify_client_secret"
SPOTIFY_REFRESH_TOKEN=""  # 今は空のままにしておく、ステップ3を参照
ADMIN_PASSWORD="set_your_secure_password"
DISCORD_WEBHOOK_URL="your_discord_webhook_url"  # オプション
```

### 3. リフレッシュトークンの取得

Spotifyは再生状態にアクセスするために一度だけユーザー認証が必要なため、リフレッシュトークンを生成する必要があります。

1. **セットアップスクリプトを実行:**
   ```bash
   npx ts-node src/setup-token.ts
   ```

2. **ターミナルの指示に従う:**
   - 生成されたURLをコピーして、ローカルブラウザで開く
   - Spotifyにログインしてアプリを認証
   - ページが読み込めない可能性があります (例: `http://127.0.0.1:3000/callback...`)。これは正常です。
   - ブラウザのアドレスバーからURL全体をコピー
   - ターミナルプロンプトにURLを貼り付けてEnterキーを押す
   - スクリプトが `SPOTIFY_REFRESH_TOKEN` を出力します

3. **`.env` ファイルを更新** して、生成されたトークンを追加します。

---

## 開発

ホットリロード機能を使用してローカルで実行:

```bash
npm run dev
```

- **フロントエンド:** http://localhost:3333 (Vite/Express経由でプロキシ)
- **管理画面:** http://localhost:3333/admin

---

## 本番環境へのデプロイ

### ビルド

TypeScriptバックエンドをコンパイルし、Svelteフロントエンドをビルド:

```bash
npm run build
```

これにより、サーバー用の `dist` フォルダが作成され、フロントエンドアセットが `public` にビルドされます。

### プロセス管理 (PM2)

PM2を使用してアプリケーションをバックグラウンドで実行し続けます。

1. **PM2をグローバルにインストール (まだの場合):**
   ```bash
   sudo npm install -g pm2
   ```

2. **アプリケーションを起動:**
   ```bash
   pm2 start ecosystem.config.js
   pm2 save
   pm2 startup
   ```

### リバースプロキシ (Nginx) & SSL

ドメイン経由でHTTPSを使用してアプリを提供します (例: `spotify.example.org`)。

1. **Nginxをインストール:**
   ```bash
   sudo apt update
   sudo apt install nginx
   ```

2. **Nginxを設定:**
   `/etc/nginx/sites-available/spotify.example.org` に設定ファイルを作成:
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

3. **サイトを有効化してNginxを再起動:**
   ```bash
   sudo ln -s /etc/nginx/sites-available/spotify.example.org /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl restart nginx
   ```

4. **SSL設定 (Certbot):**
   ```bash
   sudo apt install certbot python3-certbot-nginx
   sudo certbot --nginx -d spotify.example.org
   ```

---

## 使い方

### 公開ビュー

- **URL:** https://spotify.example.org/
- **機能:** 現在再生中のトラックの読み取り専用ビュー。コントロールは利用できません。

### 管理画面 (PWA)

- **URL:** https://spotify.example.org/admin
- **機能:** フル再生コントロール (再生、一時停止、スキップ)、ツイートボタン。
- **アクセス:** `ADMIN_PASSWORD` で設定したパスワードが必要です。
- **PWA:** モバイルデバイスにスタンドアロンアプリとしてインストール可能。
