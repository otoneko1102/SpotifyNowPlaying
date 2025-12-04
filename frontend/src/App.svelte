<script lang="ts">
  import { onMount } from "svelte";

  const currentPath = window.location.pathname;
  const validPaths = ["/", "/admin"];

  if (!validPaths.includes(currentPath)) {
    window.location.replace("/");
  }

  interface Track {
    isPlaying: boolean;
    title?: string;
    artist?: string;
    url?: string;
    albumArt?: string;
    durationMs?: number;
    progressMs?: number;
  }

  let track: Track | null = null;
  let pollInterval: any;
  let isAdmin = false;
  let showModal = false;
  let passwordInput = "";

  let isUpdating = false;

  const isAdminRoute = currentPath === "/admin";

  const fetchTrack = async () => {
    try {
      const res = await fetch("/api/nowplaying");
      const data = await res.json();
      track = data;
    } catch (e) {
      console.error(e);
    }
  };

  const verifyPassword = async (pwd: string) => {
    try {
      const res = await fetch("/api/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: pwd }),
      });
      return res.ok;
    } catch {
      return false;
    }
  };

  const handleLogin = async () => {
    const isValid = await verifyPassword(passwordInput);
    if (isValid) {
      localStorage.setItem("admin_pass", passwordInput);
      isAdmin = true;
      showModal = false;
    } else {
      alert("Invalid Password");
      window.location.href = "/";
    }
  };

  const control = async (action: "play" | "pause" | "next" | "prev") => {
    const pwd = localStorage.getItem("admin_pass");
    if (!pwd) return;

    isUpdating = true;

    if (track) {
      if (action === "pause") track.isPlaying = false;
      if (action === "play") track.isPlaying = true;
      track = track;
    }

    await fetch(`/api/control/${action}`, {
      method: "POST",
      headers: { "x-admin-pass": pwd },
    });

    setTimeout(async () => {
      await fetchTrack();
    }, 500);

    setTimeout(async () => {
      await fetchTrack();
      isUpdating = false;
    }, 2000);
  };

  onMount(() => {
    document.title = "Spotify#NowPlaying";

    (async () => {
      if (isAdminRoute) {
        const savedPass = localStorage.getItem("admin_pass");
        if (savedPass) {
          const isValid = await verifyPassword(savedPass);
          if (isValid) {
            isAdmin = true;
          } else {
            localStorage.removeItem("admin_pass");
            showModal = true;
          }
        } else {
          showModal = true;
        }
      }

      fetchTrack();
    })();

    pollInterval = setInterval(() => {
      if (!isUpdating) {
        fetchTrack();
      }
    }, 3000);

    return () => clearInterval(pollInterval);
  });

  $: progress =
    track && track.durationMs && track.progressMs
      ? (track.progressMs / track.durationMs) * 100
      : 0;

  $: shareUrl = track?.title
    ? `https://twitter.com/intent/tweet?text=${encodeURIComponent(
        `#NowPlaying\n${track.title} - ${track.artist}\n${track.url}`,
      )}`
    : "";
</script>

<main>
  {#if showModal}
    <div class="modal-overlay">
      <div class="modal">
        <h2>Admin Access</h2>
        <input
          type="password"
          bind:value={passwordInput}
          placeholder="Password"
        />
        <button on:click={handleLogin}>Login</button>
      </div>
    </div>
  {/if}

  {#if track && track.title}
    <div class="bg" style="background-image: url({track.albumArt})"></div>
    <div class="overlay"></div>

    <div class="container">
      <div class="art-area">
        <img src={track.albumArt} alt="Art" class="art" />
      </div>

      <div class="info-area">
        <h1 class="title">{track.title}</h1>
        <p class="artist">{track.artist}</p>
      </div>

      <div class="control-area">
        <div class="bar-box">
          <div class="bar" style="width: {progress}%"></div>
        </div>

        {#if isAdmin}
          <div class="btns">
            <!-- svelte-ignore a11y_consider_explicit_label -->
            <button class="btn" on:click={() => control("prev")}>
              <img src="/prev.svg" alt="Previous" class="icon" />
            </button>
            {#if track.isPlaying}
              <!-- svelte-ignore a11y_consider_explicit_label -->
              <button class="btn main-btn" on:click={() => control("pause")}>
                <img src="/pause.svg" alt="Pause" class="icon-main" />
              </button>
            {:else}
              <!-- svelte-ignore a11y_consider_explicit_label -->
              <button class="btn main-btn" on:click={() => control("play")}>
                <img src="/play.svg" alt="Play" class="icon-main" />
              </button>
            {/if}
            <!-- svelte-ignore a11y_consider_explicit_label -->
            <button class="btn" on:click={() => control("next")}>
              <img src="/next.svg" alt="Next" class="icon" />
            </button>
          </div>
        {/if}

        <div class="links">
          <a
            href={track.url}
            target="_blank"
            rel="noreferrer"
            class="link spotify">Spotify</a
          >
          {#if isAdmin}
            <a
              href={shareUrl}
              target="_blank"
              rel="noreferrer"
              class="link twitter">Post</a
            >
          {/if}

          <p class="credit">
            icon from <a
              href="https://icons8.jp"
              target="_blank"
              rel="noreferrer">Icons8</a
            >
          </p>
        </div>
      </div>
    </div>
  {:else}
    <div class="idle">
      <p>Not Playing</p>
    </div>
  {/if}
</main>

<style>
  main {
    width: 100vw;
    height: 100vh;
    height: 100dvh;
    overflow: hidden;
    position: relative;
    color: white;
    background: #121212;
    font-family: sans-serif;
  }
  .bg {
    position: absolute;
    top: -10%;
    left: -10%;
    width: 120%;
    height: 120%;
    background-size: cover;
    background-position: center;
    filter: blur(50px) brightness(0.4);
    z-index: 1;
  }
  .overlay {
    position: absolute;
    width: 100%;
    height: 100%;
    background: linear-gradient(
      to bottom,
      rgba(0, 0, 0, 0.2),
      rgba(0, 0, 0, 0.8)
    );
    z-index: 2;
  }
  .container {
    position: relative;
    z-index: 10;
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    padding: 24px;
    box-sizing: border-box;
  }
  .art-area {
    flex: 1;
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 0;
  }
  .art {
    width: 100%;
    max-width: 380px;
    aspect-ratio: 1/1;
    border-radius: 12px;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
    object-fit: cover;
  }
  .info-area {
    margin: 20px 0 30px;
    text-align: left;
    padding: 0 8px;
  }
  .title {
    font-size: 1.8rem;
    font-weight: 700;
    margin: 0 0 8px 0;
    line-height: 1.2;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  .artist {
    font-size: 1.1rem;
    color: rgba(255, 255, 255, 0.7);
    margin: 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .control-area {
    width: 100%;
    padding-bottom: 20px;
  }
  .bar-box {
    width: 100%;
    height: 4px;
    background: rgba(255, 255, 255, 0.2);
    border-radius: 2px;
    margin-bottom: 30px;
    overflow: hidden;
  }
  .bar {
    height: 100%;
    background: white;
    border-radius: 2px;
    transition: width 0.5s linear;
  }
  .btns {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 40px;
    margin-bottom: 30px;
  }
  .btn {
    background: transparent;
    border: none;
    color: white;
    cursor: pointer;
    padding: 0;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .icon {
    width: 32px;
    height: 32px;
    filter: brightness(0) invert(1);
  }
  .main-btn {
    width: 70px;
    height: 70px;
    background: white;
    color: black;
    border-radius: 50%;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  }
  .icon-main {
    width: 40px;
    height: 40px;
    filter: brightness(0);
  }
  .links {
    display: flex;
    justify-content: center;
    gap: 16px;
  }
  .link {
    text-decoration: none;
    color: white;
    font-size: 0.85rem;
    font-weight: bold;
    padding: 8px 16px;
    border-radius: 20px;
    background: rgba(255, 255, 255, 0.1);
  }
  .spotify {
    color: #1db954;
  }
  .twitter {
    color: #1da1f2;
  }
  .idle {
    width: 100%;
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    color: rgba(255, 255, 255, 0.5);
  }

  /* Modal Styles */
  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.8);
    z-index: 999;
    display: flex;
    justify-content: center;
    align-items: center;
  }
  .modal {
    background: #222;
    padding: 30px;
    border-radius: 12px;
    text-align: center;
    width: 80%;
    max-width: 300px;
    border: 1px solid #333;
  }
  .modal h2 {
    margin-top: 0;
  }
  .modal input {
    width: 100%;
    padding: 10px;
    margin: 15px 0;
    border-radius: 4px;
    border: 1px solid #444;
    background: #111;
    color: white;
    box-sizing: border-box;
  }
  .modal button {
    background: #1db954;
    color: white;
    border: none;
    padding: 10px 20px;
    border-radius: 20px;
    font-weight: bold;
    cursor: pointer;
    width: 100%;
  }

  .credit {
    margin: 20px 0 0;
    font-size: 0.75rem;
    color: rgba(255, 255, 255, 0.4);
    text-align: center;
  }
  .credit a {
    color: inherit;
    text-decoration: underline;
  }

  @media (min-width: 768px) {
    .container {
      flex-direction: row;
      align-items: center;
      justify-content: center;
      gap: 60px;
      padding: 60px;
    }
    .art-area {
      flex: 0 0 auto;
      justify-content: flex-end;
    }
    .art {
      max-width: 400px;
    }
    .info-area,
    .control-area {
      text-align: left;
      width: 400px;
    }
  }
</style>
