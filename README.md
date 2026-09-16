# Dyno The 2nd v1.6.5 — AUDIO RESOURCE FIX

This combines the verified-good v1.6.4 environment with the DSP bypass that was never actually tested on that environment.

Verified from v1.6.4 logs:
- real Debian FFmpeg: yes
- ffmpeg-static: removed
- DAVE: working
- SoundCloud: correct track + stream
- failure point: AudioResource/DSP path

v1.6.5 keeps system FFmpeg and disables all unnecessary Discord Player PCM/DSP transforms:
- disableFilterer
- disableBiquad
- disableEqualizer
- disableVolume
- disableResampler

Upload ALL files to repo root.
Startup must say 1.6.5.
