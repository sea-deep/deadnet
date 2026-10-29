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
