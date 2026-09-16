# Dyno The 2nd v1.4 COMPLETE

Replace the old `index.js` and `package.json` in the ROOT of the GitHub repo.

Railway should rebuild using Node 24.17+.

This version:
- keeps the receptionist/direct-mention filtering and school schedule
- updates Discord voice to @discordjs/voice 0.19.2
- adds DAVE-capable voice support via the current voice package
- adds FFmpeg + Opus dependencies
- destroys stale/failed voice connections
- enables detailed VOICE DEBUG logging
- waits for Ready before searching/streaming a song
- keeps queue, pause/resume, skip, loop, and stop controls

Keep DISCORD_TOKEN in Railway Variables only.
