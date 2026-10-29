let context:AudioContext|undefined;
export function tone(kind:'connect'|'mail'|'click',muted:boolean){
 if(muted)return;
 try{
  context??=new AudioContext();void context.resume();
  const now=context.currentTime;
  const notes=kind==='connect'?[220,330,440,660]:kind==='mail'?[680,510]:[300];
  notes.forEach((f,i)=>{const o=context!.createOscillator(),g=context!.createGain();o.type='sine';o.frequency.value=f;g.gain.setValueAtTime(0,now+i*.11);g.gain.linearRampToValueAtTime(.035,now+i*.11+.01);g.gain.exponentialRampToValueAtTime(.001,now+i*.11+.22);o.connect(g);g.connect(context!.destination);o.start(now+i*.11);o.stop(now+i*.11+.23);});
 }catch{/* Audio support is optional. */}
}
