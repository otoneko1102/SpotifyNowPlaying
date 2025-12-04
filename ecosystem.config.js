module.exports = {
  apps: [{
    name: "spotifynowplaying",
    script: "./dist/server.js",
    watch: false,
    env: {
      NODE_ENV: "production",
    },
    exp_backoff_restart_delay: 100,
  }]
};
