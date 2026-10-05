import { error } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';
import { actor } from './access';
export interface Statement { bind(...values:unknown[]):Statement; run():Promise<unknown>; first<T>():Promise<T|null>; all<T>():Promise<{results:T[]}> }
export interface Database { prepare(sql:string):Statement; batch(statements:Statement[]):Promise<unknown[]> }
export interface Bucket { put(key:string,value:ArrayBuffer,options?:{httpMetadata:{contentType:string}}):Promise<unknown>; get(key:string):Promise<{body:ReadableStream;httpMetadata?:{contentType?:string}}|null> }
export function storage(event:RequestEvent){const env=event.platform?.env;if(!env?.DB||!env.BUCKET)error(503,'Your gallery is temporarily unavailable. Please try again shortly.');return{db:env.DB,bucket:env.BUCKET};}
export async function owner(event:RequestEvent){
 return (await actor(event)).id;
}
export async function saveResult(event:RequestEvent,id:string,url:string){
 const {db,bucket}=storage(event),user=await owner(event);
 const row=await db.prepare('SELECT object_key FROM designs WHERE id = ? AND owner = ?').bind(id,user).first<{object_key:string|null}>();
 if(!row)return null;
 if(!row.object_key){
  const parsed=new URL(url);const host=parsed.hostname;if(parsed.protocol!=='https:'||parsed.username||parsed.password||parsed.port||(host!=='fal.media'&&!host.endsWith('.fal.media')&&host!=='storage.googleapis.com'))throw new Error('Unexpected image host');
  const response=await fetch(url,{signal:AbortSignal.timeout(20000)});if(!response.ok)throw new Error('Image download failed');
  const contentType=response.headers.get('content-type')?.split(';')[0]||'';if(!['image/jpeg','image/png','image/webp'].includes(contentType))throw new Error('Invalid image');
  const bytes=await response.arrayBuffer();if(bytes.byteLength>10_000_000)throw new Error('Image too large');
  const key=`designs/${user}/${id}`;await bucket.put(key,bytes,{httpMetadata:{contentType}});
  await db.prepare('UPDATE designs SET object_key = ? WHERE id = ? AND owner = ?').bind(key,id,user).run();
 }
 return `/api/gallery/${id}/image`;
}
