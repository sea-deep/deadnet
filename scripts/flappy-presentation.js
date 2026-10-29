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
