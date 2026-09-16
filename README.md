# Dyno The 2nd v1.6.4 — REAL FFMPEG FIX

The v1.6.3 log proved playback starts and then the audio resource ends after ~120 ms.

Discord Player's troubleshooting docs specifically identify this symptom with static FFmpeg binaries.
This build removes `ffmpeg-static` completely and installs Debian's system FFmpeg in a Docker image.

Upload ALL of these files to the repo root:
- index.js
- package.json
- Dockerfile
- .dockerignore

Railway should detect the Dockerfile and build from it.

Verify startup says:
- dyno-the-2nd@1.6.4
- Dyno The 2nd v1.6.4 online

The dependency report should now show the system FFmpeg path `/usr/bin/ffmpeg`, NOT `/app/node_modules/ffmpeg-static/ffmpeg`.
