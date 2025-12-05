import express from "express";
import cors from "cors";
import axios from "axios";
import path from "path";
import { getNowPlaying, controlSpotify, getUserProfile } from "./spotify";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const isVercel = process.env.VERCEL === "1";
const PORT = process.env.PORT || 3333;

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const DISCORD_WEBHOOK_URL = isVercel
  ? undefined
  : process.env.DISCORD_WEBHOOK_URL;

app.use(cors());
app.use(express.json());

if (!isVercel) {
  app.use(express.static(path.join(__dirname, "../public")));
}

let lastTrackId: string | null = null;

const VALID_ACTIONS = ["play", "pause", "next", "prev"] as const;
type SpotifyAction = (typeof VALID_ACTIONS)[number];
const isSpotifyAction = (action: string): action is SpotifyAction => {
  return (VALID_ACTIONS as readonly string[]).includes(action);
};

// --- Discord (for VPS or Local) ---
if (!isVercel) {
  setInterval(async () => {
    if (!DISCORD_WEBHOOK_URL) return;

    const song = await getNowPlaying();

    if (song.isPlaying && song.id && song.id !== lastTrackId) {
      lastTrackId = song.id;

      const tweetText = `#NowPlaying\n${song.title} - ${song.artist}\n${song.url}`;
      const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`;

      const content = {
        username: "Now Playing Bot",
        embeds: [
          {
            title: "🎵 Now Playing",
            description: `[${song.title}](${song.url})\nby ${song.artist}\n\n[Tweet](${tweetUrl})`,
            thumbnail: { url: song.albumArt },
            color: 0x1db954,
          },
        ],
      };

      try {
        await axios.post(DISCORD_WEBHOOK_URL, content);
        console.log(`Discord notified: ${song.title}`);
      } catch (err) {
        console.error("Discord webhook failed");
      }
    }
  }, 10000);
}

// --- API ---

app.get("/api/nowplaying", async (req, res) => {
  const data = await getNowPlaying();
  res.json(data);
});

app.get("/api/me", async (req, res) => {
  const data = await getUserProfile();
  res.json(data);
});

app.post("/api/verify", (req, res) => {
  const { password } = req.body;
  if (password === ADMIN_PASSWORD) {
    res.json({ success: true });
  } else {
    res.status(403).json({ success: false });
  }
});

app.post("/api/control/:action", async (req, res) => {
  const { action } = req.params;
  const clientPass = req.headers["x-admin-pass"];

  if (clientPass !== ADMIN_PASSWORD) {
    return res.status(403).json({ error: "Unauthorized" });
  }

  if (isSpotifyAction(action)) {
    await controlSpotify(action);
    res.json({ success: true });
  } else {
    res.status(400).json({ error: "Invalid action" });
  }
});

// for VPS or Local
if (!isVercel) {
  app.get(["/", "/admin"], (req, res) => {
    res.sendFile(path.join(__dirname, "../public/index.html"));
  });
  app.use((req, res) => {
    res.redirect("/");
  });
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

export default app;
