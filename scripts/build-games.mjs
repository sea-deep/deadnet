import fs from "node:fs";
import path from "node:path";
import { build } from "vite";
import * as sass from "sass";
const out = "public/games",
  h = "third_party/hocus-focus";
fs.mkdirSync(out, { recursive: true });
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
const base = "/games/hocus";
fs.mkdirSync(out + "/hocus/assets/css", { recursive: true });
fs.mkdirSync(out + "/hocus/assets/js", { recursive: true });
const strip = (s) => s.replace(/^---[\s\S]*?---\s*/, "");
const css = sass.compileString(
  strip(fs.readFileSync(h + "/assets/css/hocus.scss", "utf8")),
  {
    loadPaths: [path.resolve(h, "_sass")],
    style: "compressed",
    silenceDeprecations: ["import", "slash-div"],
  },
).css;
fs.writeFileSync(out + "/hocus/assets/css/hocus.css", css);
let js = strip(fs.readFileSync(h + "/_js/hocus.js", "utf8"))
  .replaceAll(
    "window.location.pathname !== '/'",
    "!(window.location.pathname.endsWith('/hocus/') || window.location.pathname.endsWith('/hocus/index.html'))",
  )
  .replaceAll(
    "window.location.href = '/'",
    "window.location.href = '../index.html'",
  );
fs.writeFileSync(out + "/hocus/assets/js/hocus.js", js);
const layout = fs.readFileSync(h + "/_layouts/default.html", "utf8");
const instructions = fs.readFileSync(
  h + "/_includes/instructions.html",
  "utf8",
);
for (const file of fs.readdirSync(h + "/pages")) {
  const raw = fs.readFileSync(h + "/pages/" + file, "utf8");
  const title = /title:\s*"([^"]+)"/.exec(raw)?.[1] || "Hocus :focus";
  const permalink =
    /permalink:\s*([^\n]+)/.exec(raw)?.[1].trim().replaceAll('"', "") || "/";
  let body = strip(raw).replace(
    "{% include instructions.html %}",
    instructions,
  );
  if (file === "end.html")
    body =
      '<div class="rules"><p>Congratulations! You did it!</p></div><p>Don’t be a monster. Make your websites keyboard accessible.</p><p><a href="https://github.com/hteumeuleu/hocus-focus">Original game by HTeuMeuLeu</a></p>';
  let html = layout
    .replace("{{ content }}", body)
    .replaceAll("{{ page.title }}", title)
    .replace(/\{\% if[\s\S]*?\%\}/g, "")
    .replaceAll("{% endif %}", "")
    .replace(/\?v=\{\{[^}]+\}\}/g, "");
  const depth = permalink === "/" ? "./" : "../";
  html = html.replace(
    /(href|src|action)="\/(?!\/)([^\"]*)"/g,
    (_m, attr, value) => `${attr}="${depth}${value}"`,
  );
  html = html.replace(/<link rel="icon"[^>]+>/, "");
  const target =
    permalink === "/"
      ? out + "/hocus/index.html"
      : out +
        "/hocus/" +
        permalink.replace(/^\//, "") +
        (permalink.endsWith("/") ? "index.html" : "");
  fs.mkdirSync(path.dirname(target), { recursive: true });
  html = html.replace(
    /(href|action)="((?:\.\/|\.\.\/)[^"]*\/)"/g,
    '$1="$2index.html"',
  );
  html = html.replace(/(href|action)="(\.\/|\.\.\/)"/g, '$1="$2index.html"');
  fs.writeFileSync(target, html);
}
fs.copyFileSync(h + "/LICENCE", out + "/hocus/LICENSE.txt");
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
for (const name of [
  "snake",
  "flappy",
  "tetris",
  "2048",
  "phantomicus",
  "hocus",
]) {
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
const { themeGames } = await import('./theme-games.mjs');
themeGames(out);
