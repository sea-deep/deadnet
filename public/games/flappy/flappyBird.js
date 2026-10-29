var cvs = document.getElementById("canvas");
var ctx = cvs.getContext("2d");

// load images

var bird = new Image();
var bg = new Image();
var fg = new Image();
var pipeNorth = new Image();
var pipeSouth = new Image();

bird.src = "images/bird.png";
bg.src = "../../assets/forest.jpg";
var batSheet=new Image();batSheet.src="../../assets/horror/bat.png";
fg.src = "images/fg.png";
pipeNorth.src = "images/pipeNorth.png";
pipeSouth.src = "images/pipeSouth.png";

// some variables

var gap = 118;

var bX = 10;
var bY = 150;

var gravity = 1.5;
var vy = 0, GRAVITY_PX = 820, FLAP_VY = -255, MAX_FALL = 380;
var speed = 60;
var lastTime = null;

var flapPower = 32;

var score = 0;
var bestScore = 0;
var gameOver = false;
var gameOverT = 0;
var GAME_OVER_DELAY = 1;
var loopPending = false;
var birdAngle = 0;
var state = "welcome";
var countdownT = 3;
var welcomeT = 0;

var FONT = "W95FA, monospace";

function loadBest(){
    try{
        if(typeof localStorage !== "undefined"){
            bestScore = parseInt(localStorage.getItem("flappyBirdBest") || "0", 10) || 0;
        }
    }catch(e){}
}

function saveBest(){
    try{
        if(typeof localStorage !== "undefined"){
            localStorage.setItem("flappyBirdBest", String(bestScore));
        }
    }catch(e){}
}

loadBest();

// audio files

var fly = new Audio();
var scoreSound = new Audio();
var bgm = new Audio();
var gameOverSound = new Audio();

fly.src = "sounds/fly.mp3";
scoreSound.src = "sounds/score.mp3";
bgm.src = "../../assets/audio/ambient-horror.ogg";
bgm.loop = true;
bgm.volume = 0.12;
gameOverSound.src = "sounds/gameover.wav";

// settings

var musicOn = loadSetting("flappyBirdMusic", true);
var sfxOn = loadSetting("flappyBirdSfx", true);

function loadSetting(key, def){
    try{
        if(typeof localStorage !== "undefined"){
            var v = localStorage.getItem(key);
            if(v !== null) return v === "1";
        }
    }catch(e){}
    return def;
}

function saveSetting(key, v){
    try{
        if(typeof localStorage !== "undefined"){
            localStorage.setItem(key, v ? "1" : "0");
        }
    }catch(e){}
}

function startBgm(){
    if(!musicOn || gameOver) return;
    var p = bgm.play();
    if(p && p.catch) p.catch(function(){});
}

function stopBgm(){
    bgm.currentTime = 0;
    bgm.pause();
}

function setMusicOn(v){
    musicOn = v;
    saveSetting("flappyBirdMusic", v);
    if(v) startBgm();
    else stopBgm();
}

function setSfxOn(v){
    sfxOn = v;
    saveSetting("flappyBirdSfx", v);
}

// on key down

document.addEventListener("keydown", moveUp);
document.addEventListener("pointerdown", function(e){
    if(e.button !== 0) return;
    handleInput();
});
document.addEventListener("contextmenu", function(e){ e.preventDefault(); });
document.addEventListener("copy", function(e){ e.preventDefault(); });
document.addEventListener("cut", function(e){ e.preventDefault(); });
document.addEventListener("dragstart", function(e){ e.preventDefault(); });

function handleInput(){
    if(settingsPanel.classList.contains("open")) return;
    if(gameOver){
        if(gameOverT >= GAME_OVER_DELAY) restart();
        return;
    }
    if(state === "welcome"){
        state = "countdown";
        countdownT = 3;
        startBgm();
        return;
    }
    if(state === "playing"){
        flap();
    }
}

function flap(){
    vy = FLAP_VY;
    birdAngle = -0.4;
    if(sfxOn){
        fly.currentTime = 0;
        var p = fly.play();
        if(p && p.catch) p.catch(function(){});
    }
}

function moveUp(e){
    if(e.repeat) return;
    if(e.key !== " " && e.key !== "ArrowUp") return;
    handleInput();
}

// pipe coordinates

var pipe = [];

var pipeGapMin = 165;
var pipeGapMax = 250;
var nextGap = 163;
var holeDeltaMax = 85;

pipe[0] = {
    x : cvs.width,
    y : 0
};

function endGame(){
    if(gameOver) return;
    gameOver = true;
    gameOverT = 0;
    stopBgm();
    if(sfxOn){
        var p = gameOverSound.play();
        if(p && p.catch) p.catch(function(){});
    }
}

function restart(){
    pipe = [];
    pipe[0] = { x : cvs.width, y : 0 };
    nextGap = 163;
    bY = 150;
    vy = 0;
    birdAngle = 0;
    score = 0;
    gameOver = false;
    lastTime = null;
    state = "welcome";
    countdownT = 3;
    welcomeT = 0;
    if(!loopPending){
        draw();
    }
}

// draw helpers

function imagesReady(){
    return bird.width > 0 && bg.width > 0 && fg.width > 0 && pipeNorth.width > 0 && pipeSouth.width > 0;
}

function roundRect(x, y, w, h, r){
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
    ctx.fill();
}

function drawScorePill(){
    ctx.font = "16px " + FONT;
    var text = String(score);
    var w = ctx.measureText(text).width + 30;
    var x = (cvs.width - w) / 2;
    ctx.fillStyle = "rgba(8, 14, 12, 0.55)";
    roundRect(x, 14, w, 36, 18);
    ctx.textAlign = "center";
    ctx.fillStyle = "rgba(0, 0, 0, 0.55)";
    ctx.fillText(text, cvs.width / 2 + 1, 41);
    ctx.fillStyle = "#ffffff";
    ctx.fillText(text, cvs.width / 2, 40);
    ctx.textAlign = "left";
}

function drawStartHint(){
    ctx.font = "16px " + FONT;
    ctx.textAlign = "center";
    ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
    ctx.fillText("TAP / SPACE TO FLAP", cvs.width / 2, 320);
    ctx.textAlign = "left";
}

function drawWelcome(){
    ctx.fillStyle = "rgba(8, 12, 16, 0.6)";
    ctx.fillRect(0, 0, cvs.width, cvs.height);

    var cw = 240;
    var ch = 160;
    var cx = (cvs.width - cw) / 2;
    var cy = 146;

    ctx.fillStyle = "rgba(112,82,127,.9)";
    roundRect(cx - 4, cy - 4, cw + 8, ch + 8, 20);
    ctx.fillStyle = "rgba(22, 30, 28, 0.97)";
    roundRect(cx, cy, cw, ch, 16);

    ctx.textAlign = "center";
    ctx.font = "18px " + FONT;
    ctx.fillStyle = "#dbb6dc";
    ctx.fillText("FLAPPY BAT", cvs.width / 2, cy + 52);

    ctx.font = "16px " + FONT;
    ctx.fillStyle = "#ffffff";
    ctx.fillText("PRESS SPACE / ↑", cvs.width / 2, cy + 100);
    ctx.fillStyle = "#93a89d";
    ctx.fillText("OR TAP TO START", cvs.width / 2, cy + 124);

    ctx.font = "14px " + FONT;
    ctx.fillStyle = "rgba(255, 255, 255, 0.55)";
    ctx.fillText("KEEP OUT OF THE LIGHT", cvs.width / 2, cy + ch - 22);

    ctx.textAlign = "left";
}

function drawCountdown(){
    ctx.font = "48px " + FONT;
    var n = Math.ceil(countdownT);
    var w = ctx.measureText(String(n)).width + 48;
    ctx.fillStyle = "rgba(8, 14, 12, 0.55)";
    roundRect((cvs.width - w) / 2, 96, w, 64, 32);
    ctx.textAlign = "center";
    ctx.fillStyle = "rgba(0, 0, 0, 0.55)";
    ctx.fillText(String(n), cvs.width / 2 + 2, 148);
    ctx.fillStyle = "#ffffff";
    ctx.fillText(String(n), cvs.width / 2, 146);
    ctx.textAlign = "left";
}

function drawGameOver(){
    ctx.fillStyle = "rgba(8, 12, 16, 0.6)";
    ctx.fillRect(0, 0, cvs.width, cvs.height);

    var cw = 240;
    var ch = 176;
    var cx = (cvs.width - cw) / 2;
    var cy = 138;

    ctx.fillStyle = "rgba(112,82,127,.9)";
    roundRect(cx - 4, cy - 4, cw + 8, ch + 8, 20);
    ctx.fillStyle = "rgba(22, 30, 28, 0.97)";
    roundRect(cx, cy, cw, ch, 16);

    ctx.textAlign = "center";
    ctx.font = "18px " + FONT;
    ctx.fillStyle = "#ff5f52";
    ctx.fillText("LOST IN THE WOODS", cvs.width / 2, cy + 46);

    ctx.fillStyle = "rgba(255, 255, 255, 0.16)";
    ctx.fillRect(cx + 26, cy + 64, cw - 52, 2);

    ctx.font = "16px " + FONT;
    ctx.fillStyle = "#93a89d";
    ctx.textAlign = "left";
    ctx.fillText("SCORE", cx + 26, cy + 100);
    ctx.textAlign = "right";
    ctx.fillStyle = "#ffffff";
    ctx.fillText(String(score), cx + cw - 26, cy + 100);

    ctx.fillStyle = "#93a89d";
    ctx.textAlign = "left";
    ctx.fillText("BEST", cx + 26, cy + 128);
    ctx.textAlign = "right";
    ctx.fillStyle = "#dbb6dc";
    ctx.fillText(String(bestScore), cx + cw - 26, cy + 128);

    ctx.textAlign = "center";
    ctx.fillStyle = gameOverT >= GAME_OVER_DELAY ? "rgba(255, 255, 255, 0.75)" : "rgba(255, 255, 255, 0.25)";
    ctx.fillText("TAP OR PRESS SPACE / ↑", cvs.width / 2, cy + ch - 22);
    ctx.textAlign = "left";
}

// draw

function draw(time){
    time = time || 0;
    var dt = 0;
    if(lastTime !== null){
        dt = Math.min((time - lastTime) / 1000, 0.05);
    }
    lastTime = time;
    loopPending = false;

    if(!imagesReady()){
        ctx.fillStyle = "#0c1915";
        ctx.fillRect(0, 0, cvs.width, cvs.height);
        ctx.font = "16px " + FONT;
        ctx.textAlign = "center";
        ctx.fillStyle = "#dbb6dc";
        ctx.fillText("LOADING", cvs.width / 2, cvs.height / 2);
        ctx.textAlign = "left";
        loopPending = true;
        requestAnimationFrame(draw);
        return;
    }

    ctx.drawImage(bg,bg.width*.26,0,bg.width*.48,bg.height,0,0,cvs.width,cvs.height);ctx.fillStyle="rgba(16,8,25,.58)";ctx.fillRect(0,0,cvs.width,cvs.height);ctx.imageSmoothingEnabled=false;

    for(var i = 0; i < pipe.length; i++){

        var constant = pipeNorth.height + gap;
        drawGate(pipe[i].x,pipe[i].y,pipeNorth.width,pipeNorth.height);
        drawGate(pipe[i].x,pipe[i].y+constant,pipeSouth.width,pipeSouth.height);

        if(gameOver || state !== "playing") continue;

        pipe[i].x -= speed * dt;

        if(pipe[i].x <= cvs.width - nextGap && !pipe[i].spawned){
            pipe[i].spawned = true;
            nextGap = pipeGapMin + Math.random() * (pipeGapMax - pipeGapMin);

            var holeMin = 30;
            var holeMax = Math.max(holeMin, Math.min(pipeNorth.height, cvs.height - fg.height - gap - 30));
            var prevHole = pipe[i].y + pipeNorth.height;
            var holeTop = prevHole + (Math.random() * 2 - 1) * holeDeltaMax;
            holeTop = Math.max(holeMin, Math.min(holeMax, holeTop));

            pipe.push({
                x : cvs.width,
                y : holeTop - pipeNorth.height
            });
        }

        if(!pipe[i].scored && pipe[i].x + pipeNorth.width <= bX){
            pipe[i].scored = true;
            score++;
            if(score > bestScore){
                bestScore = score;
                saveBest();
            }
            if(sfxOn){
                var p = scoreSound.play();
                if(p && p.catch) p.catch(function(){});
            }
        }

        if(pipe[i].x + pipeNorth.width < 0){
            pipe.splice(i,1);
            i--;
            continue;
        }

        if(bX + bird.width >= pipe[i].x && bX <= pipe[i].x + pipeNorth.width &&
           (bY <= pipe[i].y + pipeNorth.height || bY + bird.height >= pipe[i].y + constant)){
            endGame();
        }
    }

    ctx.fillStyle="#201a26";ctx.fillRect(0,cvs.height-fg.height,cvs.width,fg.height);ctx.fillStyle="#635367";ctx.fillRect(0,cvs.height-fg.height,cvs.width,2);

    ctx.save();
    ctx.translate(bX + bird.width / 2, bY + bird.height / 2);
    ctx.rotate(birdAngle);
    drawBat(BAT_FLAP[Math.floor(time/90)%BAT_FLAP.length],-bird.width/2,-bird.height/2,bird.width,bird.height);
    ctx.restore();

    if(gameOver){
        gameOverT += dt;
        if(bY + bird.height < cvs.height - fg.height){
            bY += gravity * 60 * dt;
            birdAngle += (1.3 - birdAngle) * Math.min(1, dt * 8);
        }
        drawGameOver();
        loopPending = true;
        requestAnimationFrame(draw);
        return;
    }

    if(state === "countdown"){
        countdownT -= dt;
        if(countdownT <= 0){
            state = "playing";
            bY = 150;
            vy = 0;
            birdAngle = 0;
        }
    }

    if(state === "welcome" || state === "countdown"){
        welcomeT += dt;
        bY = 150 + Math.round(Math.sin(welcomeT * 3) * 6);
        birdAngle += (0 - birdAngle) * Math.min(1, dt * 6);
    }else{
        vy = Math.min(MAX_FALL, vy + GRAVITY_PX * dt);
        bY += vy * dt;
        birdAngle = Math.max(-0.45, Math.min(1.2, vy / 320));
        if(bY < 0){ bY = 0; vy = 0; }
        if(bY + bird.height >= cvs.height - fg.height){
            endGame();
        }
    }

    if(state === "welcome"){
        drawWelcome();
    }else if(state === "countdown"){
        drawCountdown();
    }else if(score === 0){
        drawStartHint();
    }
    drawScorePill();

    loopPending = true;
    requestAnimationFrame(draw);
}

draw();

// settings UI

var settingsBtn = document.getElementById("settingsBtn");
var settingsClose = document.getElementById("settingsClose");
var settingsPanel = document.getElementById("settingsPanel");
var musicToggle = document.getElementById("musicToggle");
var sfxToggle = document.getElementById("sfxToggle");

musicToggle.checked = musicOn;
sfxToggle.checked = sfxOn;

function closeSettings(){
    settingsPanel.classList.remove("open");
    settingsPanel.setAttribute("aria-hidden", "true");
    settingsBtn.setAttribute("aria-expanded", "false");
    settingsBtn.focus();
}

settingsBtn.addEventListener("click", function(e){
    e.stopPropagation();
    var open = settingsPanel.classList.toggle("open");
    settingsPanel.setAttribute("aria-hidden", open ? "false" : "true");
    settingsBtn.setAttribute("aria-expanded", open ? "true" : "false");
    if(open) settingsClose.focus();
});

settingsBtn.addEventListener("pointerdown", function(e){ e.stopPropagation(); });
settingsPanel.addEventListener("pointerdown", function(e){ e.stopPropagation(); });
settingsClose.addEventListener("click", function(e){
    e.stopPropagation();
    closeSettings();
});
settingsClose.addEventListener("pointerdown", function(e){ e.stopPropagation(); });

musicToggle.addEventListener("change", function(){
    setMusicOn(musicToggle.checked);
});

sfxToggle.addEventListener("change", function(){
    setSfxOn(sfxToggle.checked);
});

document.addEventListener("keydown", function(e){
    if(e.key === "Escape") closeSettings();
});

function drawGate(x,y,w,h){ctx.fillStyle="#514256";ctx.fillRect(x,y,w,h);ctx.fillStyle="#8b758b";ctx.fillRect(x+3,y,3,h);ctx.fillStyle="#261e30";ctx.fillRect(x+w-7,y,5,h);ctx.fillStyle="#322737";for(var n=0;n<h;n+=24){ctx.fillRect(x,y+n,w,2);}ctx.fillStyle="#a28b9e";ctx.fillRect(x-3,y+h-8,w+6,8);}
drawWelcome = function(){ctx.fillStyle="rgba(15,9,23,.65)";ctx.fillRect(0,0,cvs.width,cvs.height);ctx.textAlign="center";ctx.font="32px "+FONT;ctx.fillStyle="#eadbc3";ctx.fillText("FLAPPY BAT",144,155);drawBat(BAT_FLAP[Math.floor(welcomeT*10)%BAT_FLAP.length],104,213,80,80);ctx.font="18px "+FONT;ctx.fillStyle="#cbb6d4";ctx.fillText("SPACE OR CLICK",144,345);ctx.textAlign="left";}
drawGameOver = function(){ctx.fillStyle="rgba(15,9,23,.87)";ctx.fillRect(0,0,cvs.width,cvs.height);ctx.textAlign="center";ctx.font="32px "+FONT;ctx.fillStyle="#dcc8bc";ctx.fillText("LOST",144,180);ctx.font="22px "+FONT;ctx.fillText("GATES  "+score,144,250);ctx.fillStyle="#b7a0c5";ctx.fillText("BEST  "+bestScore,144,285);ctx.font="18px "+FONT;ctx.fillStyle=gameOverT>=GAME_OVER_DELAY?"#eed4ac":"#5e5069";ctx.fillText("SPACE TO TRY AGAIN",144,355);ctx.textAlign="left";}
drawScorePill = function(){ctx.fillStyle="rgba(16,10,25,.8)";ctx.fillRect(114,8,60,35);ctx.textAlign="center";ctx.font="24px "+FONT;ctx.fillStyle="#eadcc6";ctx.fillText(String(score),144,34);ctx.textAlign="left";}
drawCountdown = function(){ctx.textAlign="center";ctx.font="64px "+FONT;ctx.fillStyle="#f0dfc0";ctx.fillText(String(Math.ceil(countdownT)),144,250);ctx.textAlign="left";}
fg.onload=function(){fg.height=48;};

// Bat sprite: frames 0-2 of Vander96's sheet are the wingbeat (3 hangs, 4-8 dissolve).
// The sheet faces left, so frames are mirrored to face the flight direction and
// given a 1px pale outline so a black bat reads against the dark forest.
var BAT_FLAP=[0,1,2,1],batCache={};
function batFrame(i){
  if(batCache[i])return batCache[i];
  var s=24,p=1,c=document.createElement("canvas"),m=document.createElement("canvas"),t=document.createElement("canvas");
  c.width=c.height=s+p*2;m.width=m.height=t.width=t.height=s;
  var mx=m.getContext("2d"),tx=t.getContext("2d"),x=c.getContext("2d");
  mx.imageSmoothingEnabled=tx.imageSmoothingEnabled=x.imageSmoothingEnabled=false;
  mx.translate(s,0);mx.scale(-1,1);mx.drawImage(batSheet,i*s,0,s,s,0,0,s,s);
  tx.drawImage(m,0,0);tx.globalCompositeOperation="source-in";tx.fillStyle="#d9c6e8";tx.fillRect(0,0,s,s);
  for(var dx=-1;dx<=1;dx++)for(var dy=-1;dy<=1;dy++)if(dx||dy)x.drawImage(t,p+dx,p+dy);
  x.drawImage(m,p,p);
  return(batCache[i]=c);
}
function drawBat(i,dx,dy,dw,dh){
  if(!(batSheet.complete&&batSheet.width))return;
  var size=Math.max(dw,dh),pad=size/24;
  ctx.save();ctx.filter="none";ctx.imageSmoothingEnabled=false;
  ctx.drawImage(batFrame(i),dx+(dw-size)/2-pad,dy+(dh-size)/2-pad,size+pad*2,size+pad*2);
  ctx.restore();
}
