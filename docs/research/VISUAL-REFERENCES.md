# Actual interface references

The user requested archive screenshots, larger pixel typography, sourced PNG assets, no modern serif typefaces, no repeated taglines, and more Halloween atmosphere. These requests override earlier type/art decisions.

## Screenshots inspected

- **Yahoo, 1998:** [archived screenshot reproduced by Hongkiat](https://www.hongkiat.com/blog/websites-we-visit-how-they-look-like-10-years-ago/), with [Web Design Museum’s source page](https://www.webdesignmuseum.org/gallery/yahoo-in-1998) as date context. Inspected the actual image, not just a description. Patterns adopted: centered site name, plain underlined blue links, compact navigation, real content density, thin separators. No Yahoo branding/content copied into the product.
- **Netscape Communicator 4 mailbox:** [Pádraig Brady’s Netscape/Mozilla email-client history](https://www.pixelbeat.org/docs/netscape_email/), [actual mailbox screenshot](https://www.pixelbeat.org/docs/netscape_email/ns_4_email.jpg). Inspected actual screenshot. Patterns adopted: left Local Mail folder list; upper message table with Sender/Subject/Received columns; lower reading pane; gray chrome, navy/green selected rows, full-size native controls.
- **Netscape Communicator 4.01, 1997:** [Web Design Museum reference](https://www.webdesignmuseum.org/software/netscape-communicator-4-01-in-1997). The research browser could read its historical page and image-search thumbnails, but direct screenshot downloads and local-browser rendering were blocked by its Cloudflare challenge. We did not bypass the challenge or pretend a full local capture succeeded.

Reference screenshots are research evidence, not application assets or replacements for a working UI. Their copyrights remain with their respective owners. Linked sources are the canonical references.

## Shipped asset provenance

- **Fugue Icons**, Yusuke Kamiyamane, CC BY 3.0. [Author’s site](https://p.yusukekamiyamane.com/); PNG files obtained from the [University of Kent mirror](https://github.com/unikent/fugue-icons). Eight original PNG files, no AI upscaling or traced SVG. Author attribution appears in DeadBrowser’s footer and public/assets/icons/LICENSE.txt.
- **W95FA / WIN95FA**, Alina Sava; SIL Open Font License. Self-hosted WOFF2 from Fontsource. Used for functional UI and story text; this is not a distributed Microsoft font. License in public/assets/fonts/W95FA-LICENSE.txt.
- **VT323**, Peter Hull; SIL Open Font License. Self-hosted WOFF2 from @fontsource/vt323 5.3.0. Used for actual terminal records and boot diagnostics. License shipped beside font.
- **Earthrise**, NASA / William Anders (Apollo 8, 1968), public-domain US federal imagery. [NASA source](https://science.nasa.gov/resource/image-earthrise/). An actual photograph in the fictional cached-image panel; identified and credited. It is not presented as original project photography.
- **Pumpkin Sun**, NASA/GSFC/SDO, October 8, 2014. [NASA source](https://svs.gsfc.nasa.gov/11711/). Actual false-color extreme-ultraviolet solar imagery, combining two wavelength captures; not a visible-light photograph or AI illustration. Used as a dark desktop/boot background, scaled by CSS. Credit in CREDITS.md. It supplies an uncanny Halloween face without a stock ghost or invented artwork.

No modern serif font remains in the UI. The earlier handmade SVG icons and promotional boot taglines were removed following user feedback. Technical model details live in System Monitor. Baseline/replay disclosures remain visible because hiding them would misrepresent inference.
