import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {Store} from '../server/store.ts';
import {Engine} from '../server/engine.ts';
import {BaselineModel} from '../server/baseline.ts';
import {DecisionSchema} from '../server/decision.ts';
import {promptFor,type ModelAdapter,type ModelInput} from '../server/model.ts';
class Observer extends BaselineModel {inputs:ModelInput[]=[];override async generate(input:ModelInput){this.inputs.push(structuredClone(input));return super.generate(input);}}
function setup(model:ModelAdapter=new BaselineModel(),path=':memory:'){const store=new Store(path),engine=new Engine(store,model);return {store,engine};}
test('society: privately introduced evidence propagates through model-selected recipient and survives restart',async()=>{
 const dir=mkdtempSync(join(tmpdir(),'deadnet-'));const file=join(dir,'world.sqlite');const {store,engine}=setup(new BaselineModel(),file);
 await engine.dispatch({type:'collect',evidenceId:'carrier'});
 await engine.dispatch({type:'message',target:'mara',text:'What does this mean?',evidenceId:'carrier'});
 let w=engine.world();assert(w.agents[0].knownFacts.includes('carrier'));assert(!w.agents[1].knownFacts.includes('carrier'));
 const rumor=w.events.find(e=>e.actor==='mara'&&e.to==='len'&&e.factIds.includes('carrier'));assert(rumor);
 await engine.dispatch({type:'tick'});w=engine.world();const len=w.agents[1];assert(len.knownFacts.includes('carrier'));assert.equal(len.stance,'deny');assert.equal(len.relationships.mara,7);assert(!w.agents[2].seen.includes(rumor.id));store.close();
 const reopened=new Store(file);assert.equal(reopened.load().agents[1].relationships.mara,7);assert(reopened.load().agents[1].knownFacts.includes('carrier'));reopened.close();rmSync(dir,{recursive:true});
});
test('memory: private secret is remembered by recipient and excluded from unrelated prompts',async()=>{
 const model=new Observer();const {engine,store}=setup(model);
 await engine.dispatch({type:'message',target:'len',text:'My secret is a silver apricot.'});
 assert(engine.world().agents[1].memories.some(m=>m.text.includes('silver apricot')));
 await engine.dispatch({type:'tick'});const other=model.inputs.at(-1)!;assert.notEqual(other.agent.id,'len');assert(!JSON.stringify(promptFor(other)).includes('silver apricot'));store.close();
});
test('investigation: unlock requires two records; collected facts do not teleport to characters',async()=>{
 const {engine,store}=setup();await assert.rejects(engine.dispatch({type:'collect',evidenceId:'manifest'}));
 await engine.dispatch({type:'collect',evidenceId:'carrier'});assert(!engine.world().agents[0].knownFacts.length);
 await engine.dispatch({type:'collect',evidenceId:'birthday'});await engine.dispatch({type:'collect',evidenceId:'manifest'});
 await engine.dispatch({type:'resolve',choice:'sealed'});assert.equal(engine.world().ending,'sealed');await assert.rejects(engine.dispatch({type:'publish',evidenceId:'carrier'}));await assert.rejects(engine.dispatch({type:'resolve',choice:'exposed'}));store.close();
});
test('public evidence is learned only after an account reads it; publishing prevents sealing',async()=>{
 const {engine,store}=setup();for(const evidenceId of ['carrier','birthday','manifest'])await engine.dispatch({type:'collect',evidenceId});
 await engine.dispatch({type:'publish',evidenceId:'carrier'});assert(!engine.world().agents[1].knownFacts.includes('carrier'));
 await assert.rejects(engine.dispatch({type:'resolve',choice:'sealed'}));await engine.dispatch({type:'resolve',choice:'exposed'});assert.equal(engine.world().published.length,3);store.close();
});
test('autonomy: finite allowance, bounded memory, and explicit renewal',async()=>{
 const {engine,store}=setup();for(let i=0;i<18;i++)await engine.dispatch({type:'tick'});assert.equal(engine.world().remainingTurns,0);await assert.rejects(engine.dispatch({type:'tick'}));assert(engine.world().agents.every(a=>a.memories.length<=12));await engine.dispatch({type:'renew'});assert.equal(engine.world().remainingTurns,18);store.close();
});
test('invalid model decisions cannot mutate relationships or create fictional evidence',async()=>{
 class Malformed extends BaselineModel {override async generate(i:ModelInput){const out=await super.generate(i);return {...out,decision:{...out.decision,trustDelta:999}};}}
 const {engine,store}=setup(new Malformed());await engine.dispatch({type:'message',target:'len',text:'hello'});assert.equal(engine.world().agents[1].relationships.visitor,2);assert.equal(engine.world().traces.at(-1)?.status,'error');assert.equal(engine.world().agents[1].memories.length,0);store.close();
 assert.equal(DecisionSchema.safeParse({text:'hello',stance:'accept',shareWith:'public',trustDelta:1,memory:'hello',execute:'rm -rf'}).success,false);
});
test('provider failure saves a trace, keeps the incoming message unread, and does not substitute scripted text',async()=>{
 class Down extends BaselineModel {override async generate():Promise<never>{throw new Error('Provider unavailable');}}
 const {engine,store}=setup(new Down());await engine.dispatch({type:'message',target:'len',text:'private observation'});const w=engine.world();assert.equal(w.traces.at(-1)?.status,'error');assert.equal(w.events.filter(e=>e.origin==='baseline'||e.origin==='model').length,0);assert.equal(w.agents[1].memories.length,0);assert(w.events.some(e=>e.actor==='visitor'));store.close();
});
test('concurrent writes are rejected without losing the first operation',async()=>{
 let release:()=>void=()=>{};const gate=new Promise<void>(r=>{release=r;});
 class Slow extends BaselineModel {override async generate(i:ModelInput){await gate;return super.generate(i);}}
 const {engine,store}=setup(new Slow());const pending=engine.dispatch({type:'tick'});await assert.rejects(engine.dispatch({type:'collect',evidenceId:'carrier'}));release();await pending;assert.equal(engine.world().tick,1);store.close();
});
