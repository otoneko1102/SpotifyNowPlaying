# Spotify Now Playing (Vercel デプロイ)

**[English](./README.md)** | **[日本語](./README-ja.md)** | **[English for Vercel](./README-for-vercel.md)** | **Vercel用日本語**

これは **Spotify Now Playing** ウェブアプリケーションのVercel対応バージョンです。Vercelのサーバーレス機能 (ホビープラン対応) で実行でき、無料でホストできます。

> [!WARNING]
> Vercelのサーバーレス性により、**Discord通知機能 (バックグラウンドポーリング) は無効**となり動作しません。WebUIと管理画面コントローラーのみ利用可能です。

## 目次

- [前提条件](#前提条件)
- [1. ローカルセットアップ (トークン生成用)](#1-ローカルセットアップ-トークン生成用)
- [2. Spotify Developer セットアップ](#2-spotify-developer-セットアップ)
- [3. リフレッシュトークンの取得](#3-リフレッシュトークンの取得)
- [4. Vercelへのデプロイ](#4-vercelへのデプロイ)
- [使い方](#使い方)

---

## 前提条件

- **GitHub** アカウント
- **Vercel** アカウント
- **Spotify Developer** アカウント
- **Node.js** (ローカルマシンにインストール済み)

---

## 1. ローカルセットアップ (トークン生成用)

Spotifyリフレッシュトークンを生成するため、プロジェクトを**一度ローカルで実行**する必要があります。このトークンはVercel上では直接生成できません。

1. **リポジトリをクローン:**
   ```bash
   git clone https://github.com/otoneko1102/SpotifyNowPlaying.git
   cd spotifynowplaying
   ```

2. **依存関係をインストール:**
   ```bash
   npm install
   ```

---

## 2. Spotify Developer セットアップ

1. [Spotify Developer Dashboard](https://developer.spotify.com/dashboard/) にアクセス
2. 新しいアプリを作成
3. **Client ID** と **Client Secret** をメモ
4. アプリ設定で、以下のリダイレクトURIを追加:
   ```
   http://127.0.0.1:3000/callback
   ```

   > [!NOTE]
   > これはローカルのトークン生成スクリプトで必要です。

---

## 3. リフレッシュトークンの取得

**ローカルマシン**上でセットアップスクリプトを実行します:

1. **一時的な .env ファイルを作成** (オプションですが、スクリプト実行時に役立ちます):
   ```env
   SPOTIFY_CLIENT_ID="your_client_id"
   SPOTIFY_CLIENT_SECRET="your_client_secret"
   ```

2. **スクリプトを実行:**
   ```bash
   npx ts-node src/setup-token.ts
   ```

3. **指示に従う:**
   - 生成されたURLをブラウザで開く
   - アプリを認可する
   - リダイレクト先のURL全体をコピー (エラーページが表示されても構いません)
   - ターミナルにURLを貼り付ける
   - **SPOTIFY_REFRESH_TOKEN の出力を保存してください。** Vercelで必要になります。

---

## 4. Vercelへのデプロイ

1. **コードをGitHubにプッシュ.**

2. **Vercelにログイン** し、**"Add New..."** -> **"Project"** をクリック。

3. **リポジトリをインポート.**

4. **プロジェクトを設定:**
   - **Framework Preset:** Vite
   - **Root Directory:** ./
   - **Build Command:** npm run build
   - **Output Directory:** public

5. **環境変数:**
   Vercelダッシュボードで以下の変数を追加:

   | 変数名 | 値 | 説明 |
   |--------|-----|------|
   | VERCEL | 1 | **必須.** サーバーレスモードを有効化します。 |
   | SPOTIFY_CLIENT_ID | (あなたのClient ID) | Spotifyダッシュボードから取得。 |
   | SPOTIFY_CLIENT_SECRET | (あなたのSecret) | Spotifyダッシュボードから取得。 |
   | SPOTIFY_REFRESH_TOKEN | (あなたのトークン) | ステップ3で生成したトークン。 |
   | ADMIN_PASSWORD | (あなたのパスワード) | /adminページにアクセスするパスワード。 |

   > [!CAUTION]
   > DISCORD_WEBHOOK_URLは追加しないでください。Vercelではサポートされていません。

6. **Deploy** をクリック。

---

## 使い方

デプロイ後、Vercel URL (例: https://your-project.vercel.app) にアクセスします。

### 公開ビュー
- **URL:** https://your-project.vercel.app/
- **機能:** Spotifyで現在再生中の曲を表示します。

### 管理画面
- **URL:** https://your-project.vercel.app/admin
- **機能:** 再生コントロール (再生、一時停止、スキップ) とツイートボタン。
- **アクセス:** ADMIN_PASSWORD が必要です。
