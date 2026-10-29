(function () {
  var muted = true, contexts = [], sounds = [], media = new Map();
  function sync() {
    var quiet = muted || document.hidden;
    sounds.concat(Array.prototype.slice.call(document.querySelectorAll('audio,video'))).forEach(function (item) {
      if (quiet) { if (!media.has(item)) media.set(item, item.muted); item.muted = true; }
      else if (media.has(item)) { item.muted = media.get(item); media.delete(item); }
    });
    contexts.forEach(function (context) {
      if (quiet) context.suspend().catch(function () {});
      else context.resume().catch(function () {});
    });
  }
  var Original = window.AudioContext || window.webkitAudioContext;
  if (Original) {
    var resume = Original.prototype.resume;
    Original.prototype.resume = function () { return muted || document.hidden ? Promise.resolve() : resume.call(this); };
    function HostedAudioContext(options) { var context = new Original(options); contexts.push(context); if (muted) context.suspend().catch(function () {}); return context; }
    HostedAudioContext.prototype = Original.prototype;
    window.AudioContext = HostedAudioContext;
    if (window.webkitAudioContext) window.webkitAudioContext = HostedAudioContext;
  }
  var play = HTMLMediaElement.prototype.play;
  HTMLMediaElement.prototype.play = function () { if (sounds.indexOf(this) === -1) sounds.push(this); if (muted || document.hidden) { if (!media.has(this)) media.set(this, this.muted); this.muted = true; } return play.call(this); };
  window.addEventListener('message', function (event) {
    if (event.source !== parent || event.origin !== location.origin || !event.data || event.data.type !== 'deadnet-audio') return;
    muted = Boolean(event.data.muted); sync();
  });
  document.addEventListener('visibilitychange', sync);
})();
(function () {
 var paused=false,queue=[],native=window.requestAnimationFrame,offset=0,pauseAt=0,quiet=false,snakeWasPaused=false;
 window.deadnetGameTime=function(){return (quiet?pauseAt:performance.now())-offset;};
 window.requestAnimationFrame=function(callback){return native.call(window,function(time){if(paused||document.hidden)queue.push(callback);else callback(time-offset);});};
 function syncPause(){
  var next=paused||document.hidden;
  if(next&&!quiet){pauseAt=performance.now();if(document.body&&document.body.getAttribute('data-game')==='snake'&&typeof mySnakeBoard!=='undefined'){snakeWasPaused=mySnakeBoard.getPaused();mySnakeBoard.setPaused(true);}}
  if(!next&&quiet){offset+=performance.now()-pauseAt;if(document.body&&document.body.getAttribute('data-game')==='snake'&&typeof mySnakeBoard!=='undefined')mySnakeBoard.setPaused(snakeWasPaused);}
  quiet=next;if(next)return;var pending=queue;queue=[];pending.forEach(function(callback){window.requestAnimationFrame(callback);});
 }
 window.addEventListener('message',function(event){
  if(event.source!==parent||event.origin!==location.origin||!event.data)return;
  if(event.data.type==='deadnet-pause'){paused=Boolean(event.data.paused);syncPause();}
  if(event.data.type==='deadnet-key'&&!paused){
   var game=document.body.getAttribute('data-game');
   if(game==='snake'&&typeof mySnakeBoard!=='undefined'){if(event.data.down)mySnakeBoard.simulateKeyPress(event.data.keyCode);return;}
   var keyEvent=new KeyboardEvent(event.data.down?'keydown':'keyup',{key:event.data.key,code:event.data.code,keyCode:event.data.keyCode,which:event.data.keyCode,bubbles:true,cancelable:true});
   document.dispatchEvent(keyEvent);
   if(event.data.down&&!keyEvent.defaultPrevented&&game==='hocus'){
    if(event.data.key==='Tab'){var buttons=Array.prototype.slice.call(document.querySelectorAll('button:not([disabled]),a[href],input:not([disabled]),select')).filter(function(el){return el.offsetWidth>0&&el.offsetHeight>0&&el.getAttribute('tabindex')!=='-1';});var index=buttons.indexOf(document.activeElement);if(buttons.length)buttons[(index+1)%buttons.length].focus();}
    if(event.data.key==='Enter'&&document.activeElement&&document.activeElement.tagName==='BUTTON')document.activeElement.dispatchEvent(new KeyboardEvent('keypress',{key:'Enter',keyCode:13,which:13,bubbles:true,cancelable:true}));
   }
  }
 });document.addEventListener('visibilitychange',syncPause);
})();
