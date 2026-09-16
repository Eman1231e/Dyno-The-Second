# Dyno The 2nd — Receptionist v1.1

Upload `index.js` and `package.json` to the root of the GitHub repository, replacing the old versions.

Railway variable required:

`DISCORD_TOKEN`

## School schedule
- Monday: 9:15 AM–4:30 PM
- Tuesday: 9:15 AM–4:30 PM
- Wednesday: 9:45 AM–4:30 PM
- Thursday: 9:15 AM–4:30 PM
- Friday: 9:15 AM–4:30 PM
- Time zone: America/Toronto

## Owner commands
- dynostatus — Automatic / Available / School / Busy / Away / Sleeping / Custom
- dynostatuscheck — shows current effective receptionist status

Ping cooldown: 5 minutes per person.

## Direct-ping rules
The receptionist only responds when Dyno's user is directly mentioned in the message text.

It ignores:
- @everyone
- @here
- role mentions, including roles Dyno has
- replies to Dyno
