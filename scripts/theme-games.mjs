import fs from "node:fs";
import path from "node:path";
export function themeGames(out) {
  let flappy = fs.readFileSync(out + "/flappy/flappyBird.js", "utf8");
  flappy = flappy.replace(
    'bg.src = "images/bg.png";',
    'bg.src = "../../assets/forest.jpg";\nvar batSheet=new Image();batSheet.src="../../assets/horror/bat.png";',
  );
  flappy = flappy
    .replace(
      'bgm.src = "sounds/bgm.wav";',
      'bgm.src = "../../assets/audio/ambient-horror.ogg";',
    )
    .replace("bgm.volume = 0.45;", "bgm.volume = 0.12;")
    .replace(
      "var FONT = \"'Press Start 2P', monospace\";",
      'var FONT = "W95FA, monospace";',
    );
  flappy = flappy.replace(
    "ctx.drawImage(bg,0,0);",
    'ctx.drawImage(bg,bg.width*.26,0,bg.width*.48,bg.height,0,0,cvs.width,cvs.height);ctx.fillStyle="rgba(16,8,25,.58)";ctx.fillRect(0,0,cvs.width,cvs.height);ctx.imageSmoothingEnabled=false;',
  );
  flappy = flappy
    .replace(
      "ctx.drawImage(pipeNorth,pipe[i].x,pipe[i].y);",
      "drawGate(pipe[i].x,pipe[i].y,pipeNorth.width,pipeNorth.height);",
    )
    .replace(
      "ctx.drawImage(pipeSouth,pipe[i].x,pipe[i].y + constant);",
      "drawGate(pipe[i].x,pipe[i].y+constant,pipeSouth.width,pipeSouth.height);",
    );
  flappy = flappy.replace(
    "ctx.drawImage(fg,0,cvs.height - fg.height);",
    'ctx.fillStyle="#201a26";ctx.fillRect(0,cvs.height-fg.height,cvs.width,fg.height);ctx.fillStyle="#635367";ctx.fillRect(0,cvs.height-fg.height,cvs.width,2);',
  );
  flappy = flappy.replace(
    "ctx.drawImage(bird, -bird.width / 2, -bird.height / 2);",
    "drawBat(BAT_FLAP[Math.floor(time/90)%BAT_FLAP.length],-bird.width/2,-bird.height/2,bird.width,bird.height);",
  );
  flappy = flappy
    .replaceAll("FLAPPY BIRD", "FLAPPY BAT")
    .replaceAll("DODGE THE PIPES", "KEEP OUT OF THE LIGHT")
    .replaceAll("GAME OVER", "LOST IN THE WOODS")
    .replaceAll('"10px " + FONT', '"16px " + FONT')
    .replaceAll('"8px " + FONT', '"14px " + FONT')
    .replaceAll("#f8c948", "#dbb6dc")
    .replaceAll("rgba(248, 201, 72, 0.85)", "rgba(112,82,127,.9)");
  flappy +=
    '\nfunction drawGate(x,y,w,h){ctx.fillStyle="#514256";ctx.fillRect(x,y,w,h);ctx.fillStyle="#8b758b";ctx.fillRect(x+3,y,3,h);ctx.fillStyle="#261e30";ctx.fillRect(x+w-7,y,5,h);ctx.fillStyle="#322737";for(var n=0;n<h;n+=24){ctx.fillRect(x,y+n,w,2);}ctx.fillStyle="#a28b9e";ctx.fillRect(x-3,y+h-8,w+6,8);}\n';
  // Real momentum: gravity accelerates the bat and a flap sets an upward
  // velocity (the original fell at a constant speed and teleported 32px up).
  // Wider gaps and gentler height changes make it fair to play.
  const physics = [
    ["var gap = 85;", "var gap = 118;"],
    [
      "var gravity = 1.5;",
      "var gravity = 1.5;\nvar vy = 0, GRAVITY_PX = 820, FLAP_VY = -255, MAX_FALL = 380;",
    ],
    ["var pipeGapMin = 140;", "var pipeGapMin = 165;"],
    ["var holeDeltaMax = 120;", "var holeDeltaMax = 85;"],
    ["    bY -= flapPower;", "    vy = FLAP_VY;"],
    [
      "        bY += gravity * 60 * dt;\n        birdAngle += (1.3 - birdAngle) * Math.min(1, dt * 8);\n        if(bY < 0) bY = 0;",
      "        vy = Math.min(MAX_FALL, vy + GRAVITY_PX * dt);\n        bY += vy * dt;\n        birdAngle = Math.max(-0.45, Math.min(1.2, vy / 320));\n        if(bY < 0){ bY = 0; vy = 0; }",
    ],
    [
      "            bY = 150;\n            birdAngle = 0;",
      "            bY = 150;\n            vy = 0;\n            birdAngle = 0;",
    ],
    ["    bY = 150;\n    birdAngle = 0;\n    score = 0;", "    bY = 150;\n    vy = 0;\n    birdAngle = 0;\n    score = 0;"],
  ];
  for (const [from, to] of physics) {
    if (!flappy.includes(from)) throw new Error("Flappy physics patch missing: " + from);
    flappy = flappy.replace(from, to);
  }
  flappy += fs.readFileSync("scripts/flappy-presentation.js", "utf8");
  fs.writeFileSync(out + "/flappy/flappyBird.js", flappy);
  let tetris = fs.readFileSync(out + "/tetris/index.html", "utf8");
  const colors = {
    cyan: "#b4c0ae",
    blue: "#666480",
    orange: "#a66a46",
    yellow: "#c4b390",
    green: "#708674",
    purple: "#836383",
    red: "#985e68",
  };
  for (const [c, v] of Object.entries(colors))
    tetris = tetris.replace("color: '" + c + "'", "color: '" + v + "'");
  tetris = tetris
    .replace("score <span", "souls <span")
    .replace("rows <span", "buried <span");
  fs.writeFileSync(out + "/tetris/index.html", tetris);
  const snakeScript = out + "/snake/js/snake.js";
  fs.writeFileSync(
    snakeScript,
    fs
      .readFileSync(snakeScript, "utf8")
      .replaceAll("JavaScript Snake", "Grave Snake")
      .replaceAll("You died :(", "The bones stopped moving.")
      .replaceAll("On Windows, press F11 to play in Full Screen mode.", ""),
  );
  for (const name of [
    "snake",
    "flappy",
    "tetris",
    "2048",
    "phantomicus",
  ]) {
    fs.copyFileSync("scripts/game-theme.css", out + "/" + name + "/theme.css");
    fs.copyFileSync("scripts/game-fit.js", out + "/" + name + "/game-fit.js");
    function walk(dir) {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const f = path.join(dir, entry.name);
        if (entry.isDirectory()) walk(f);
        else if (f.endsWith(".html")) {
          let s = fs.readFileSync(f, "utf8");
          const rel = path
            .relative(path.dirname(f), out + "/" + name + "/theme.css")
            .replaceAll("\\", "/");
          s = s
            .replace(
              "</head>",
              '<link rel="stylesheet" href="' + rel + '"></head>',
            )
            .replace(/<body([^>]*)>/, '<body$1 data-game="' + name + '">');
          if (name === "flappy") s = s.replace(/<svg[\s\S]*?<\/svg>/, "Sound");
          if (name === "2048")
            s = s
              .replace(
                '<h1 class="title">2048</h1>',
                '<h1 class="title">Séance 2048</h1>',
              )
              .replace(
                "Join the numbers and get to the <strong>2048 tile!</strong>",
                "Bring the numbers together.",
              );
          if (name === "snake")
            s = s
              .replaceAll("JavaScript Snake", "Grave Snake")
              .replaceAll("You died :(", "The bones stopped moving.");
          s = s.replace(
            "</body>",
            '<script src="' +
              rel.replace("theme.css", "game-fit.js") +
              '"></script></body>',
          );
          fs.writeFileSync(f, s);
        }
      }
    }
    walk(out + "/" + name);
  }
}
