# Incorporated third-party projects

The user explicitly requested reuse of existing desktop and game projects. DEADNET’s society engine and characters remain new; these credited components are supporting software and are not claimed as original games or desktop primitives.

| Component | Upstream and pinned revision | License | Modifications |
| --- | --- | --- | --- |
| 98.css 0.1.21 | https://github.com/jdan/98.css ; upstream inspected at b1d7a907371bbe523d6f64e3af97f714fdbd6d6a ; npm 0.1.21 distribution | MIT, preserved in third_party/98.css/LICENSE | Reused native windows/controls/title/status grammar. Removed upstream font-face declarations; adapted React classes, keyboard/mouse management, responsive layout, W95FA text sizing, and application-specific styles. This is a design system, not a copied functioning OS. |
| Phantomicus | https://github.com/codyebberson/js13k-phantomicus at c622449f8fff75d2c5743077c81eff4049a7ca3e | MIT, preserved in source and built game | Built with Vite for the local Games folder. Title/game melody covers were excluded because the upstream credits reference outside compositions; the author’s synthesized effects remain. No gameplay authorship claim. |
| Hocus :focus | https://github.com/hteumeuleu/hocus-focus at b491233cfb3c087f89be288cccf767467ae40ffe | MIT, preserved in source and built game | Compiled Jekyll/Sass source into static pages. Rewrote internal URLs for a subdirectory and explicit index.html navigation. Removed social sharing from final page. Original game content and author credit remain. |

| Snake | https://github.com/patorjk/JavaScript-Snake at 3243086c0badb4b4c6bedfe6d95d5a52a7caaa88 | MIT, Patrick Gillespie and contributors | Vendored static game and themes; tracking code removed. Original author links retained. TuiCss and bundled DOS font notices remain with their assets. |
| Flappy Bird | https://github.com/pyforgedev/flappy-bird at 29369e112225c35cd1da77e43cf02aa5ed1408a1 | MIT, Masyura Fanni Ramadhan / pyforgedev | Self-hosted game; external font requests removed; host sound-preference bridge. Classic game is a remake, not original DEADNET game design. |
| Tetris | https://github.com/jakesgordon/javascript-tetris at e5c0c42f7dac0f3514a55eff656c6e22e95d68ed | MIT, Jake Gordon | Self-hosted canvas game; host sound-preference bridge. |
| 2048 | https://github.com/gabrielecirulli/2048 at 478b6ec346e3787f589e4af751378d06ded4cbbc | MIT, Gabriele Cirulli | Self-hosted game; removed the upstream statement calling this derivative the official site; author/concept credits retained. Host sound-preference bridge. |

Authoring sources are under third_party/. Built browser files are under public/games/. Rebuild with `node scripts/build-games.mjs`. No upstream .git directories, commit dates, or contributor histories were imported. All borrowed code is visibly separated and licensed. The new repo’s history begins October 29, 2026.

Fugue Icons (Yusuke Kamiyamane, CC BY 3.0) and W95FA/VT323 (SIL OFL) retain their separate credits and license files. Games display creator links in their host window. Further creative/technical influences are in CREDITS.md.

All game entrypoints use explicit index.html URLs to avoid the app server’s SPA fallback. A small host bridge propagates mute/background preferences to HTML audio and Web Audio. Upstream game logic is otherwise preserved. Modern games in a 1999 computer are a deliberate playful anachronism, not a claim of historical accuracy.
