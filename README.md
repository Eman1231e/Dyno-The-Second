# Dyno The 2nd v1.6.1

Targeted audio-pipeline patch:
- explicitly installs mediaplex (Discord Player's recommended Opus backend)
- preserves SoundCloud search/streaming
- adds 15s buffering/connection limits
- adds a hard 25s command timeout so /play cannot spin forever
- receptionist/school logic unchanged

Replace index.js and package.json.
Delete old Aptfile/nixpacks.toml if still present.
