import { Engine } from '../server/engine';
import { BaselineModel } from '../server/baseline';
import { ARCHIVE, seedWorld } from '../server/seed';
import type { Action, World } from './types';
const key='deadnet-exhibition-v1';
let memory:World=seedWorld('baseline');
try{const saved=localStorage.getItem(key);if(saved)memory=JSON.parse(saved);}catch{/* Storage may be blocked in private browser sessions. */}
const store={load:()=>structuredClone(memory),save:(w:World)=>{memory=structuredClone(w);try{localStorage.setItem(key,JSON.stringify(w));}catch{/* Keep session memory. */}},reset:(w:World)=>store.save(w)};
const engine=new Engine(store,new BaselineModel());
engine.boot();
export function read(){return {world:engine.world(),archive:ARCHIVE,status:{available:false,provider:'exhibition',model:'deterministic-baseline-v1',voice:false,busy:false,message:'Interactive deterministic exhibition. No live AI runs in this hosted edition. Run locally for Gemma inference.'}};}
export async function act(action:Action){if(action.type==='mode'&&action.mode==='live')throw new Error('Live Gemma requires the local installation. This hosted exhibition uses deterministic fixtures.');await engine.dispatch(action);return read();}
