import express from "express";
import cors from "cors";
import axios from "axios";
import path from "path";
import { getNowPlaying, controlSpotify } from "./spotify";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3333;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "../public")));

let lastTrackId: string | null = null;

// --- Discord ---

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

// --- API ---

app.get("/api/nowplaying", async (req, res) => {
  const data = await getNowPlaying();
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

  if (["play", "pause", "next", "prev"].includes(action)) {
    // @ts-ignore
    await controlSpotify(action);
    res.json({ success: true });
  } else {
    res.status(400).json({ error: "Invalid action" });
  }
});

app.get(["/", "/admin"], (req, res) => {
  res.sendFile(path.join(__dirname, "../public/index.html"));
});

app.use((req, res) => {
  res.redirect("/");
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
