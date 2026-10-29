import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import type { World } from '../src/types.ts';
import { seedWorld } from './seed.ts';
export class Store {
 readonly db: DatabaseSync;
 constructor(path=process.env.DEADNET_DB || '.data/deadnet.sqlite') {
  if(path!==':memory:') mkdirSync(dirname(path),{recursive:true});
  this.db=new DatabaseSync(path);
  this.db.exec(`PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON;
   CREATE TABLE IF NOT EXISTS migrations(version INTEGER PRIMARY KEY, applied_at TEXT NOT NULL);
   CREATE TABLE IF NOT EXISTS world(id INTEGER PRIMARY KEY CHECK(id=1), snapshot TEXT NOT NULL);
   CREATE TABLE IF NOT EXISTS revisions(revision INTEGER PRIMARY KEY, tick INTEGER NOT NULL, action TEXT NOT NULL, created_at TEXT NOT NULL);
   CREATE TABLE IF NOT EXISTS audio(cache_key TEXT PRIMARY KEY, payload BLOB NOT NULL, chars INTEGER NOT NULL, created_at TEXT NOT NULL);
   CREATE TABLE IF NOT EXISTS voice_usage(id INTEGER PRIMARY KEY AUTOINCREMENT, chars INTEGER NOT NULL, status TEXT NOT NULL, created_at TEXT NOT NULL);
   INSERT OR IGNORE INTO migrations VALUES(1,datetime('now'));`);
  if(!this.db.prepare('SELECT id FROM world WHERE id=1').get())this.save(seedWorld(),'create');
 }
 load(): World {return JSON.parse((this.db.prepare('SELECT snapshot FROM world WHERE id=1').get() as {snapshot:string}).snapshot);}
 save(world:World,action:string) {
  this.db.exec('BEGIN IMMEDIATE');
  try {
   this.db.prepare('INSERT INTO world(id,snapshot) VALUES(1,?) ON CONFLICT(id) DO UPDATE SET snapshot=excluded.snapshot').run(JSON.stringify(world));
   this.db.prepare('INSERT OR REPLACE INTO revisions VALUES(?,?,?,?)').run(world.revision,world.tick,action,new Date().toISOString());
   this.db.exec('COMMIT');
  }catch(e){this.db.exec('ROLLBACK');throw e;}
 }
 reset(world:World){this.db.exec('DELETE FROM revisions');this.save(world,'reset');}
 audio(key:string):Uint8Array|undefined {return (this.db.prepare('SELECT payload FROM audio WHERE cache_key=?').get(key) as {payload:Uint8Array}|undefined)?.payload;}
 cacheAudio(key:string,data:Uint8Array,chars:number){this.db.prepare('INSERT OR REPLACE INTO audio VALUES(?,?,?,?)').run(key,data,chars,new Date().toISOString());}
 voiceUsage(chars:number,status:string){this.db.prepare('INSERT INTO voice_usage(chars,status,created_at) VALUES(?,?,?)').run(chars,status,new Date().toISOString());}
 close(){this.db.close();}
}
