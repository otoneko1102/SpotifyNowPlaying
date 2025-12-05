import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const basic = Buffer.from(
  `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`,
).toString("base64");

const TOKEN_ENDPOINT = "https://accounts.spotify.com/api/token";
const NOW_PLAYING_ENDPOINT =
  "https://api.spotify.com/v1/me/player/currently-playing";
const ME_ENDPOINT = "https://api.spotify.com/v1/me/";

const PLAY_ENDPOINT = "https://api.spotify.com/v1/me/player/play";
const PAUSE_ENDPOINT = "https://api.spotify.com/v1/me/player/pause";
const NEXT_ENDPOINT = "https://api.spotify.com/v1/me/player/next";
const PREVIOUS_ENDPOINT = "https://api.spotify.com/v1/me/player/previous";

export interface Song {
  isPlaying: boolean;
  title: string;
  artist: string;
  url: string;
  albumArt: string;
  durationMs: number;
  progressMs: number;
  id: string;
}

export interface NotPlaying {
  isPlaying: false;
}

interface User {
  name: string;
  url: string;
}

let userProfileCache: User | null = null;

const getAccessToken = async () => {
  const response = await axios.post(
    TOKEN_ENDPOINT,
    new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: process.env.SPOTIFY_REFRESH_TOKEN as string,
    }).toString(),
    {
      headers: {
        Authorization: `Basic ${basic}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
    },
  );
  return response.data.access_token;
};

export const getNowPlaying = async (): Promise<Song | NotPlaying> => {
  try {
    const access_token = await getAccessToken();
    const response = await axios.get(NOW_PLAYING_ENDPOINT, {
      headers: { Authorization: `Bearer ${access_token}` },
    });

    // 204 No Content or Error
    if (response.status === 204 || response.status > 400) {
      return { isPlaying: false };
    }

    const item = response.data.item;
    if (!item) return { isPlaying: false };

    let albumArt = "";
    if (item.album && item.album.images && item.album.images.length > 0) {
      albumArt = item.album.images[0].url;
    }

    let trackUrl = "";
    if (item.external_urls && item.external_urls.spotify) {
      trackUrl = item.external_urls.spotify;
    }

    const artistName = item.artists
      ? item.artists.map((artist: any) => artist.name).join(", ")
      : "Unknown Artist";

    const song: Song = {
      isPlaying: response.data.is_playing,
      title: item.name || "Unknown Title",
      artist: artistName,
      url: trackUrl,
      albumArt: albumArt,
      durationMs: item.duration_ms || 0,
      progressMs: response.data.progress_ms || 0,
      id: item.id || "unknown_id",
    };

    return song;
  } catch (error) {
    console.error("Error fetching Now Playing:", error);
    return { isPlaying: false };
  }
};

export const controlSpotify = async (
  action: "play" | "pause" | "next" | "prev",
) => {
  try {
    const access_token = await getAccessToken();
    const config = {
      headers: { Authorization: `Bearer ${access_token}` },
    };

    switch (action) {
      case "play":
        await axios.put(PLAY_ENDPOINT, {}, config);
        break;
      case "pause":
        await axios.put(PAUSE_ENDPOINT, {}, config);
        break;
      case "next":
        await axios.post(NEXT_ENDPOINT, {}, config);
        break;
      case "prev":
        await axios.post(PREVIOUS_ENDPOINT, {}, config);
        break;
    }
    return true;
  } catch (error) {
    console.error(`Error controlling Spotify (${action}):`, error);
    return false;
  }
};

export const getUserProfile = async () => {
  if (userProfileCache) return userProfileCache;

  try {
    const access_token = await getAccessToken();
    const response = await axios.get(ME_ENDPOINT, {
      headers: { Authorization: `Bearer ${access_token}` },
    });

    const data = response.data;

    if (!data || !data.external_urls || !data.external_urls.spotify) {
      console.warn("User Profile Warning: Incomplete data received.", data);
      return null;
    }

    const displayName = data.display_name || data.id || "Spotify User";

    userProfileCache = {
      name: displayName,
      url: data.external_urls.spotify,
    };

    return userProfileCache;
  } catch (error) {
    console.error("Error fetching User Profile:", error);
    return null;
  }
};
