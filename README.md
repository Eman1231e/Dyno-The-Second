# Dyno The 2nd v1.5
Complete replacement build.

Music change: play-dl has been removed completely. Search and playback now use yt-dlp, with FFmpeg piping raw 48 kHz stereo audio into @discordjs/voice.

Replace index.js and package.json in the GitHub repo root and redeploy Railway.
Keep DISCORD_TOKEN in Railway Variables.
