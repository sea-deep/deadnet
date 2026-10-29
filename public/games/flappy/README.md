<p align="center">
  <img src="favicon/android-chrome-192x192.png" alt="Flappy Bird" width="96" height="96">
</p>

<h1 align="center">🐤 Flappy Bird</h1>

<p align="center">
  A faithful remake of the classic arcade flappy-bird game, built with pure vanilla JavaScript and the HTML5 Canvas.
  Zero dependencies, zero build step, zero frameworks.
</p>

<p align="center">
  <a href="http://flappybird.pyforgedev.web.id/"><img src="https://img.shields.io/badge/Live%20Demo-▶%20Play%20Now-2ea44f" alt="Live Demo"></a>
  <a href="./LICENSE"><img src="https://img.shields.io/badge/License-MIT-blue" alt="MIT License"></a>
  <a href="https://github.com/pyforgedev/flappy-bird"><img src="https://img.shields.io/badge/JavaScript-ES5-yellow" alt="JavaScript ES5"></a>
  <a href="https://github.com/pyforgedev/flappy-bird"><img src="https://img.shields.io/badge/HTML5-Canvas-e34f26" alt="HTML5 Canvas"></a>
  <a href="https://github.com/pyforgedev/flappy-bird"><img src="https://img.shields.io/badge/Dependencies-Zero-brightgreen" alt="Zero Dependencies"></a>
  <a href="https://github.com/pyforgedev/flappy-bird"><img src="https://img.shields.io/badge/Build-None-orange" alt="No Build Step"></a>
</p>

---

## 📖 Table of Contents

- [✨ Features](#-features)
- [🛠 Tech Stack](#-tech-stack)
- [🎮 How to Play](#-how-to-play)
- [⚙️ Gameplay Details](#️-gameplay-details)
- [🚀 Getting Started](#-getting-started)
- [📁 Project Structure](#-project-structure)
- [🕹 Controls](#-controls)
- [🤝 Contributing](#-contributing)
- [📄 License](#-license)

## ✨ Features

- **Delta-time scaled movement** — gameplay is identical across 30 fps, 60 fps, 144 Hz, and beyond
- **Keyboard + touch input** — tap, `Space`, or `Arrow Up`
- **Randomized pipe spacing** — horizontal distance between pipes varies (140–250 px) for a fresh run every time
- **Fair, always-solvable pipe gaps** — hole position shifts gradually (±120 px max) between pipes, so impossible patterns never spawn
- **In-canvas HUD** — score pill, start hint, countdown, and a game-over card with current + best score
- **Best score persisted** in `localStorage`
- **Anti-miss-tap protection** — 1 s restart delay after game over; right-click, copy, and drag are disabled
- **Bird tilt animation** and physics-based flapping
- **Audio feedback** — flap and score sound effects
- **Canvas loading state** while images are fetching
- **Responsive page shell** — dark palette, Press Start 2P display font, PWA-style favicon set

## 🛠 Tech Stack

| | |
|---|---|
| 🎨 **UI** | HTML5, Canvas 2D API, inline CSS |
| ⚙️ **Logic** | Vanilla JavaScript (ES5, single file, no modules) |
| 🧠 **State** | `localStorage` (best score + music/SFX preferences) |
| 🎵 **Assets** | PNG sprites, MP3/WAV audio (SFX + BGM loop) |
| 🧰 **Tooling** | None — no bundler, no transpiler, no dependencies |

## 🎮 How to Play

Control the bird as it falls under gravity — each flap gives it a boost upward. Guide it through the gaps between pipes to score points. One collision with a pipe or the ground ends the run.

## ⚙️ Gameplay Details

The entire difficulty profile lives in a handful of tunable constants at the top of `flappyBird.js`:

| Constant | Default | Purpose |
|---|---|---|
| `gap` | `85` | Vertical opening between a pipe pair (px) |
| `flapPower` | `32` | Upward boost per flap (px) |
| `gravity` | `1.5` | Falling acceleration |
| `speed` | `60` | Pipe scroll speed (px/s) |
| `pipeGapMin` / `pipeGapMax` | `140` / `250` | Horizontal distance between pipe pairs (px) |
| `holeDeltaMax` | `120` | Max vertical shift of the hole between consecutive pipes (px) |
| `GAME_OVER_DELAY` | `1` | Seconds before restart input is accepted |

## 🚀 Getting Started

No build step, no install, no dependencies. Serve the repo root and open `index.html` in a browser:

```bash
python3 -m http.server 8000
# visit http://localhost:8000
```

> **⚠️ Do not open `index.html` via `file://`.** Images and audio are loaded by relative path and will fail or behave inconsistently without an HTTP server.

## 📁 Project Structure

```
.
├── index.html          # Page shell — 288×512 canvas, inline CSS, meta/OG tags
├── flappyBird.js       # Entire game in one file (no modules)
├── images/             # bg, bird, foreground, pipe sprites
├── sounds/             # fly.mp3, score.mp3, bgm.wav, gameover.wav
├── favicon/            # Favicon set and webmanifest
└── LICENSE             # MIT license
```

## 🕹 Controls

| Input | Action |
|---|---|
| `Space` or `Arrow Up` | Flap / start / restart |
| Tap / click (left button) | Same as above |
| Right-click | Disabled |

## 🤝 Contributing

PRs are welcome! This project intentionally has **zero tooling**, so contributions should follow the same constraint: plain HTML/CSS/JS, no build step, no new dependencies.

1. Fork the repository
2. Create a feature branch (`git checkout -b feat/your-feature`)
3. Commit your changes (see [Conventional Commits](https://www.conventionalcommits.org/))
4. Open a pull request

## 📄 License

Distributed under the [MIT License](./LICENSE). See `LICENSE` for more information.
