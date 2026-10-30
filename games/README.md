# Blacklight Games

The Team Blacklight Game Development Division portal. This is a separate static site in the `games/` directory so it can be deployed independently from the main Team Blacklight website.

## Included

- Responsive purple/cyan cyberpunk portal design.
- Team Blacklight Originals showcase: VOID FRONTIER, Escape the Forsaken (ETFR), and The Long Dusk.
- Searchable, category-filtered game library, including a favourites filter.
- Per-browser favourites and recently played history using local storage.
- Starfall Courier, a playable HTML5 canvas arcade game.
- Keyboard and touch controls; local best-score saving.
- No account or backend required for the current portal features.

## Local preview

Open `index.html` in a browser, or serve this directory with any static HTTP server. No build step, package manager, backend, or API keys are required.

## Deploying to games.teamblacklight.ca

Create a separate static-site deployment connected to this repository:

- Repository: `Team-Blacklight/homepage-development`
- Production branch: `main`
- Root directory: `games`
- Build command: leave empty / none
- Output directory: `.` (the `games` directory itself)

Then configure the custom domain `games.teamblacklight.ca` in the hosting provider and add the DNS record it specifies. The existing main-site files at the repository root are not changed by this subdirectory deployment.

## Adding a game

1. Add the game files under `games/` (for example, `games/arcade/new-game.html`).
2. Add a card to the `#game-grid` element in `index.html`.
3. Set `data-category` to `arcade`, `original`, or `experimental`, and provide searchable words in `data-search`.
4. Give each card a stable `data-game-id` so favourites and recent history remain attached to the correct game.
5. Keep third-party embeds and downloads permission-based; link to the original creator and follow their hosting terms.

## Current status

This is the first portal foundation, not a finished Steam replacement. VOID FRONTIER is presented as in development; its multiplayer universe and backend are not implemented here. ETFR links to its existing itch.io project page. Favourites and recent history are currently stored in the visitor's browser, not synced between devices.
