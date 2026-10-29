import { createHash } from 'node:crypto';
import type { Event } from '../src/types.ts';
import { Store } from './store.ts';
import { RuleError } from './engine.ts';
export class AudioService {
 private pending=new Map<string,Promise<Uint8Array>>();
 constructor(private store:Store){}
 configured(){return !!(process.env.ELEVENLABS_API_KEY&&process.env.ELEVENLABS_VOICE_ID);}
 async speech(event:Event):Promise<Uint8Array>{
  if(!this.configured())throw new RuleError('Voice is not configured. The complete transcript is available below.',503);
  if(event.channel!=='mail'||event.to!=='visitor'||event.actor==='visitor')throw new RuleError('Only received voicemail can be played.');
  const text=event.text.slice(0,900);
  const voice=process.env.ELEVENLABS_VOICE_ID!;
  const model=process.env.ELEVENLABS_MODEL||'eleven_flash_v2_5';
  const key=createHash('sha256').update(JSON.stringify([text,voice,model])).digest('hex');
  const cached=this.store.audio(key);if(cached)return cached;
  if(this.pending.has(key))return this.pending.get(key)!;
  const count=(this.store.db.prepare('SELECT count(*) n FROM voice_usage').get() as {n:number}).n;
  if(count>=10)throw new RuleError('Voice generation limit reached (10 requests per installation). Existing recordings still play; the transcript is always available.',429);
  const task=(async()=>{
   this.store.voiceUsage(text.length,'requested');
   const response=await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voice)}?output_format=mp3_44100_128`,{method:'POST',headers:{'xi-api-key':process.env.ELEVENLABS_API_KEY!,'Content-Type':'application/json'},body:JSON.stringify({text,model_id:model,voice_settings:{stability:0.7,similarity_boost:0.65}}),signal:AbortSignal.timeout(25000)});
   if(!response.ok)throw new RuleError(`Voice provider returned ${response.status}. Read the transcript or retry later.`,502);
   const data=new Uint8Array(await response.arrayBuffer());
   if(data.length<100)throw new RuleError('Voice provider returned empty audio. Read the transcript.',502);
   this.store.cacheAudio(key,data,text.length);return data;
  })();
  this.pending.set(key,task);try{return await task;}finally{this.pending.delete(key);}
 }
}
