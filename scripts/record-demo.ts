import {chromium} from '@playwright/test';
import {mkdirSync,writeFileSync,renameSync} from 'node:fs';
import {Store} from '../server/store.ts';
// Reuse the exact verified operator recording; no duplicate paid generation for filming.
const voice=new Store('.data/voice-verification.sqlite'),demo=new Store('.data/demo.sqlite');
for(const row of voice.db.prepare('SELECT cache_key,payload,chars FROM audio').all() as {cache_key:string;payload:Uint8Array;chars:number}[])demo.cacheAudio(row.cache_key,row.payload,row.chars);
voice.close();demo.close();
mkdirSync('.data/recording',{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true});const context=await browser.newContext({viewport:{width:1280,height:800},deviceScaleFactor:1,recordVideo:{dir:'.data/recording',size:{width:1280,height:800}}});const page=await context.newPage();const start=performance.now();const markers:{at:number;caption:string}[]=[];
const mark=(caption:string)=>{const at=(performance.now()-start)/1000;markers.push({at,caption});console.log(`${at.toFixed(1)}s: ${caption}`);};
const wait=(ms:number)=>page.waitForTimeout(ms);
async function action(data:unknown){const r=await page.request.post('http://127.0.0.1:3200/api/action',{data});if(!r.ok())throw new Error(await r.text());}
async function app(name:string){await page.getByRole('button',{name:'Start',exact:true}).click();await page.getByRole('navigation',{name:'Start menu'}).getByRole('button',{name,exact:true}).click();}
await action({type:'mode',mode:'live'});await action({type:'reset'});
await page.goto('http://127.0.0.1:3200');await page.getByRole('button',{name:'Establish connection'}).waitFor();mark('Captured from the running local build. All accounts are fictional.');await wait(4000);await page.getByRole('button',{name:'Establish connection'}).click();await action({type:'auto',enabled:false});mark('An ordinary morning. The network has three persistent accounts.');await wait(7000);
await app('GhostMail');mark('A message mentions a file you have not opened.');await wait(7000);
await app('Archive.exe');const archive=page.getByRole('region',{name:'Archive.exe'});mark('The recovered carrier log contradicts the accounts.');await wait(7000);await archive.getByRole('button',{name:'Recover this record'}).click();await wait(1500);await archive.getByRole('button',{name:'Open notebook'}).click();await wait(2500);
const notebook=page.getByRole('region',{name:'Evidence notebook'});await notebook.getByRole('button',{name:'Tell one account…'}).click();mark('Only Mara receives the evidence. Gemma decides her response.');await wait(1500);await notebook.getByRole('button',{name:'Tell Mara'}).click();await page.waitForFunction(async()=>!(await(await fetch('/api/state')).json()).status.busy);await wait(1500);
const mail=page.getByRole('region',{name:'GhostMail'});const inboxMessages=mail.locator('.mail-list button');if(await inboxMessages.count()>1)await inboxMessages.first().click();await wait(7000);
await app('System Monitor');const monitor=page.getByRole('region',{name:'System Monitor'});mark('Bounded autonomous turns: accounts read and react without visitor messages.');
for(let i=0;i<3;i++){await monitor.getByRole('button',{name:'Advance one turn'}).click();await page.waitForFunction(async()=>!(await(await fetch('/api/state')).json()).status.busy);await wait(1500);}
await monitor.getByRole('button',{name:'Inference traces'}).click();await wait(5000);await app('DeadBrowser');mark('New messages are generated locally; their decisions and sources are inspectable.');await wait(6500);
await app('Archive.exe');await archive.getByRole('button',{name:'HAPPY_BIRTHDAY.EML'}).click();await wait(4000);await archive.getByRole('button',{name:'Recover this record'}).click();await expectSaved();
async function expectSaved(){await page.waitForFunction(async()=>!(await(await fetch('/api/state')).json()).status.busy);await wait(800);}
await app('GhostMail');await mail.locator('.mail-list button').filter({hasText:'LINE03.WAV'}).click();mark('The operator’s written report and recovered voice tell different stories.');await wait(3500);await mail.getByRole('button',{name:'Listen as voicemail'}).click();await mail.getByLabel('Voicemail playback').waitFor();const audioAt=(performance.now()-start)/1000;await wait(16000);await mail.getByText('Read original voicemail transcript').click();await wait(2500);
await app('Archive.exe');await archive.getByRole('button',{name:'CONTINUITY.INI'}).click();await wait(3500);await archive.getByRole('button',{name:'Recover this record'}).click();await expectSaved();await archive.getByRole('button',{name:'Open notebook'}).click();const final=page.getByRole('region',{name:'Evidence notebook'});await final.getByRole('button',{name:'Release the complete record'}).scrollIntoViewIfNeeded();mark('A persistent choice: release the record, or preserve the fiction.');await wait(4000);await final.getByRole('button',{name:'Release the complete record'}).click();await wait(5000);
const duration=(performance.now()-start)/1000;writeFileSync('docs/evidence/demo-markers.json',JSON.stringify({audioAt,duration,markers,note:'Actual local UI capture. Live generations; authored archival voicemail rendered by ElevenLabs. Audio muxed from the same verified cached recording because Playwright video captures frames without sound.'},null,2));
const video=page.video()!;await context.close();const path=await video.path();renameSync(path,'.data/recording/deadnet-raw.webm');await browser.close();console.log('Recording complete.');
