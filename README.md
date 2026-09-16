# Dyno The 2nd v1.6.2 — DSP HANG FIX

The v1.6.1 log identified the exact hang:
`Initiating DSP filters pipeline...`

This build:
- disables Discord Player's JS DSP/filterer pipeline entirely
- disables unused equalizer, volume, biquad, and resampler processors
- explicitly forces skipFFmpeg=false
- explicitly passes the FFmpeg path to Discord Player
- keeps SoundCloud extraction, voice, receptionist, and the 25-second safety timeout

Replace index.js and package.json in the repo root.
