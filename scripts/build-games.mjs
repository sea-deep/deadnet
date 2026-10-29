import fs from "node:fs";
import path from "node:path";
import { build } from "vite";
const out = "public/games";
// Hocus :focus was removed from the playable edition.
fs.rmSync(out + "/hocus", { recursive: true, force: true });
fs.mkdirSync(out, { recursive: true });
fs.copyFileSync(
  "third_party/phantomicus/thumbnail-320x320.png",
  "public/assets/icons/phantomicus-game.png",
);
fs.copyFileSync(
  "third_party/2048/meta/apple-touch-icon.png",
  "public/assets/icons/2048-game.png",
);
await build({
  configFile: false,
  root: path.resolve("third_party/phantomicus"),
  base: "./",
  build: {
    outDir: path.resolve(out, "phantomicus"),
    emptyOutDir: true,
    minify: "esbuild",
    sourcemap: false,
  },
});
fs.copyFileSync(
  "third_party/phantomicus/LICENSE",
  out + "/phantomicus/LICENSE.txt",
);
console.log(
  "Built credited, vendored games. Phantomicus music covers excluded.",
);
for (const name of ["tetris", "2048", "flappy"]) {
  fs.cpSync("third_party/" + name, out + "/" + name, {
    recursive: true,
    filter: (p) => !/(?:node_modules|\.git)(?:\/|$)/.test(p),
  });
  let html = fs.readFileSync(out + "/" + name + "/index.html", "utf8");
  html = html
    .replace(/<link[^>]+fonts\.(?:googleapis|gstatic)[^>]+>/g, "")
    .replace(/<script[^>]+google[^>]*>[\s\S]*?<\/script>/g, "");
  fs.writeFileSync(out + "/" + name + "/index.html", html);
}
fs.cpSync("third_party/snake/src", out + "/snake", {
  recursive: true,
  filter: (p) => !p.endsWith("Thumbs.db"),
});
fs.copyFileSync("third_party/snake/LICENSE", out + "/snake/LICENSE.txt");
let snake = fs.readFileSync(out + "/snake/index.html", "utf8");
snake = snake
  .replace(
    /<script async src="https:\/\/www.googletagmanager.com[^>]*><\/script>/g,
    "",
  )
  .replace(/<script>\s*window\.dataLayer[\s\S]*?<\/script>/g, "");
fs.writeFileSync(out + "/snake/index.html", snake);
// Each game stays independently credited; this bridge only handles host audio preferences.
for (const name of ["snake", "flappy", "tetris", "2048", "phantomicus"]) {
  fs.copyFileSync(
    "scripts/game-host-bridge.js",
    out + "/" + name + "/deadnet-host.js",
  );
  function visit(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const file = path.join(dir, entry.name);
      if (entry.isDirectory()) visit(file);
      else if (entry.name.endsWith(".html")) {
        let html = fs.readFileSync(file, "utf8");
        if (name === "2048")
          html = html
            .replace(
              /<p class="game-explanation">[\s\S]*?<\/p>/,
              '<p class="game-explanation">Use your <strong>arrow keys</strong> to move the tiles.</p>',
            )
            .replace(
              /<p>\s*<strong class="important">Note:<\/strong>[\s\S]*?<\/p>/,
              "",
            );
        const bridge = path
          .relative(path.dirname(file), out + "/" + name + "/deadnet-host.js")
          .replaceAll("\\", "/");
        html = html.replace(
          "<head>",
          '<head><script src="' + bridge + '"></script>',
        );
        fs.writeFileSync(file, html);
      }
    }
  }
  visit(out + "/" + name);
}
const { themeGames } = await import("./theme-games.mjs");
themeGames(out);
