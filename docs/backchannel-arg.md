# Team Blacklight ARG — Backchannel 0.1

## Current implementation
- Public entry point: the Team Blacklight terminal command `signal`.
- Alternate discovery: click the footer's ◈ marker five times within 1.8 seconds.
- Destination: `backchannel.html`.
- First puzzle: enter `source` to decode packet 002.
- Discovery progress is stored locally in browser localStorage only.

## Story and safety boundaries
This is a fictional browser-based experience. It must not direct players to real-world locations, trespass, contact uninvolved people, probe systems, access private infrastructure, or seek real credentials. Never place secrets, tokens, staff details, or operational network information in public clues.

## Headscale domain
`headscale.teamblacklight.ca` is a proposed story-facing name only. This implementation does not create DNS records, deploy a server, or connect to Headscale. If the subdomain is later used for a real Headscale control server, keep its administrative/API surfaces private and authenticated; host the public ARG experience separately.

## Future ARG roadmap
1. Packet 003 and a second on-site clue.
2. A public archive page with fictional recovered files.
3. A local discovery journal showing unlocked fragments.
4. Optional seasonal chapters with resettable progress.
5. Accessibility alternatives for every visual/audio clue.
