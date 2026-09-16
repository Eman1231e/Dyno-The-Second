# Dyno The 2nd v1.6.3 — DAVE FIX

The crash was explicit:
`DAVE protocol support requires the @snazzah/davey package.`

This build adds `@snazzah/davey` and pins the working Discord Player stack versions so `latest` cannot unexpectedly move them.

Replace BOTH:
- index.js
- package.json

Verify Railway startup says:
- dyno-the-2nd@1.6.3
- Dyno The 2nd v1.6.3 online

If it says 1.6.1 or 1.6.2, Railway is running an older deployment.
