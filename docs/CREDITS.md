# Credits and licenses

DEADNET story, characters, copy, application-specific CSS, and synthesized system tones were created for this repository beginning October 29, 2026. Sourced assets are listed below. No Microsoft logos, original Windows icons, proprietary font files, sampled system sounds, or real deceased individuals’ likenesses/voices are included. OS-era interaction conventions are a reference, not an affiliation.

Creative and technical influences: [Hypnospace Outlaw](https://www.hypnospace.net/), [98.js](https://github.com/1j01/98), [Generative Agents](https://github.com/joonspk-research/generative_agents), and [AI Town](https://github.com/AITownFun/ai-town). These are credited precedents; their nontrivial source code and content were not copied.

Direct runtime dependencies: React / React DOM (MIT), react-rnd (MIT; wraps react-draggable and re-resizable), Express (MIT), Zod (MIT), dotenv (BSD-2-Clause). Vite, TypeScript, tsx, Playwright, and type packages are development tooling; the lockfile pins exact resolved versions. Node provides SQLite. See each installed package’s LICENSE for upstream terms. This repository’s MIT license does not replace third-party licenses.

Gemma 4 weights are separately distributed by Google under Apache-2.0 according to its [model card](https://ai.google.dev/gemma/docs/core/model_card_4). Weights are not checked into this repository. Ollama is separately installed and licensed. Gemma 3 alternatives have their own terms; do not assume Gemma 4 licensing applies to earlier generations.

Optional ElevenLabs audio uses the configured provider account and a voice the user has rights to use. No paid voice recording is redistributed by default. The cache is ignored. Provider and voice licenses govern generated recordings separately from this code license.

## Sourced visual assets

Fugue PNG icons © Yusuke Kamiyamane, CC BY 3.0, [author](https://p.yusukekamiyamane.com/), [distribution mirror](https://github.com/unikent/fugue-icons). License shipped in public/assets/icons/LICENSE.txt; attribution in the linked credits and packaged license. No icons were traced or generated.

W95FA by Alina Sava and VT323 by Peter Hull: SIL Open Font License, self-hosted WOFF2 distributions from Fontsource; licenses beside the fonts. Earlier IBM Plex experiments are not shipped.

[Earthrise](https://science.nasa.gov/resource/image-earthrise/), NASA / William Anders, Apollo 8, 1968. [Pumpkin Sun](https://svs.gsfc.nasa.gov/11711/), NASA/GSFC/SDO, 2014, a composite of real extreme-ultraviolet solar captures, not a visible-light photo or AI image. NASA US federal imagery is public domain subject to its [media usage guidelines](https://www.nasa.gov/nasa-brand-center/images-and-media/). No NASA endorsement implied. Earthrise is a credited image in Nora’s album. Pumpkin Sun was used in an earlier design and remains an unused source asset.

Actual Yahoo 1998 and Netscape mailbox reference screenshots were inspected for navigation density, functional type sizing, and split-pane layout. Their copyrights remain with the respective owners; no vendor graphics or reference screenshots ship inside the application. See research/VISUAL-REFERENCES.md.

## Wallpaper and sound

[Forest photograph](https://unsplash.com/photos/trees-on-forest-with-sun-rays-sp-p7uuT0tw) © Sebastian Unrau, 2015, [Unsplash License](https://unsplash.com/license). Downloaded as a 1920 px raster JPEG; CSS darkens it without generating replacement artwork.

[Ambient horror](https://opengameart.org/content/ambient-horror) by techiew, December 28, 2022, CC0. The original OGG is self-hosted at public/assets/audio/ambient-horror.ogg. Boot/mail/disk/line cues are original Web Audio synthesis. Game effects retain their upstream licenses.

The desktop adapts jdan’s MIT **98.css**. Five games are vendored under their respective MIT licenses. Only Phantomicus displays an on-screen creator link; required source notices remain in each distribution. Full pinned revisions, modifications, and source locations are in [THIRD-PARTY.md](THIRD-PARTY.md). Their code, art and gameplay are not claimed as new DEADNET work.

## Room 317 revision

The murder case, Nora’s private signal, chats, note fragments and revised call are new fictional DEADNET writing. Nora and all suspects are fictional. The current call uses ElevenLabs’ premade Lily library voice, not a real victim’s likeness or a cloned private voice. The original Daniel recording remains historical evidence of the earlier prototype and is no longer the game’s call.

New game raster sources and exact reskin/input changes are documented in THIRD-PARTY.md and public/assets/horror/CREDITS.txt. The five included games retain their source and license notices. Hocus :focus has been removed. OpenRouter’s verified current reply used the open-weight Dots3-Note Preview model; the underlying model is recorded per turn. Local Gemma remains a separately verified option. Runtime provider/model licenses are separate from the application’s MIT license.

## Personal-computer rebuild

**Metal brass keys** by Gausanchennai, September 29, 2018, [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Metal_brass_keys.jpg), [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/). The original JPEG is self-hosted unchanged. Nora’s caption, date and fictional ownership are authored story content; the photograph’s metadata is not evidence of a real case. The image and any adaptations remain under CC BY-SA 4.0.

**Chicago95 White cursor pack** from [grassmunk / Chicago95](https://github.com/grassmunk/Chicago95/tree/master/Cursors/Chicago95_Cursor_White/src), whose upstream README declares GPL-3.0+/MIT. The separately packaged cursor rasters use GPL-3.0-or-later with original PNGs, hotspot config sources, upstream README/credits and GPL text in public/assets/cursors/chicago95/. The earlier isolated JS Paint cursor experiment was replaced and its unused files removed. No system cursor installation or image generation is performed.

The **Phantomicus thumbnail** is original project artwork by Cody Ebberson, distributed with the MIT source. **2048’s touch icon** is original project artwork by Gabriele Cirulli, likewise retained with its MIT source. Both are used as game icons, not claimed as new DEADNET logos. Additional My Computer, USB, calendar and photo icons are the existing Fugue collection, CC BY 3.0.

Windows 98 and Outlook Express reference screenshots from [GUIdebook](https://guidebookgallery.org/screenshots/win98/) were inspected. Research captures are in docs/research/revamp; they do not ship in the application. Their owners retain copyright.
