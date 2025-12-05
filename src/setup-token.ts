import axios from "axios";
import dotenv from "dotenv";
import readline from "readline";

dotenv.config();

const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;

const REDIRECT_URI = "http://127.0.0.1:3000/callback";

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error(
    "Error: Please set SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET in your .env file.",
  );
  process.exit(1);
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const main = async () => {
  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    response_type: "code",
    redirect_uri: REDIRECT_URI,
    scope:
      "user-read-currently-playing user-read-playback-state user-modify-playback-state user-read-private",
  });

  // Using standard Spotify Auth endpoint
  const authUrl = `https://accounts.spotify.com/authorize?${params.toString()}`;

  console.log("---------------------------------------------------");
  console.log("             SpotifyAuth - Manual Mode             ");
  console.log("---------------------------------------------------");
  console.log("Please follow these steps:");
  console.log("1. Open the URL displayed below in your browser.");
  console.log('2. Log in to Spotify and click "Agree".');
  console.log(
    '3. You will see a "This site can\'t be reached" error page. This is normal.',
  );
  console.log("4. Copy the ENTIRE URL from your browser's address bar.");
  console.log("   (Example: http://127.0.0.1:3000/callback?code=NApCC... )");
  console.log("\nHere is the URL to open:");
  console.log(authUrl);
  console.log("---------------------------------------------------");
  rl.question(
    "5. Paste the copied URL (or the code string) here and press Enter:\n> ",
    async (inputUrl) => {
      let code = inputUrl.trim();
      if (code.includes("code=")) {
        const match = code.match(/code=([^&]*)/);
        if (match) {
          code = match[1];
        }
      }
      if (!code) {
        console.error("❌ Code not found. Please try again.");
        rl.close();
        return;
      }
      try {
        const tokenParams = new URLSearchParams();
        tokenParams.append("grant_type", "authorization_code");
        tokenParams.append("code", code);
        tokenParams.append("redirect_uri", REDIRECT_URI);

        const response = await axios.post(
          "https://accounts.spotify.com/api/token",
          tokenParams,
          {
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
              Authorization:
                "Basic " +
                Buffer.from(CLIENT_ID + ":" + CLIENT_SECRET).toString("base64"),
            },
          },
        );

        const refreshToken = response.data.refresh_token;

        console.log("\n✅ Success! Here is your Refresh Token:");
        console.log("---------------------------------------------------");
        console.log(`SPOTIFY_REFRESH_TOKEN="${refreshToken}"`);
        console.log("---------------------------------------------------");
        console.log(
          "Please paste this line into your .env file and restart the server.",
        );
      } catch (error: any) {
        console.error("\n❌ An error occurred:");
        if (error.response) {
          console.error("Status:", error.response.status);
          console.error("Data:", JSON.stringify(error.response.data, null, 2));
        } else {
          console.error(error.message);
        }
      } finally {
        rl.close();
      }
    },
  );
};

main();
