import { error } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';
import { storage } from './gallery';
export function appOnly(event:RequestEvent){if(event.request.headers.get('x-rose-app')!=='standalone')error(403,'Install Rose Atelier and open it from your home screen to generate a design.');}
export async function hash(value:string){return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value))),n=>n.toString(16).padStart(2,'0')).join('');}
export function guestToken(event:RequestEvent,create=false){let token=event.cookies.get('rose-gallery');if(token&&/^[a-f0-9]{64}$/.test(token))return token;if(!create)return null;token=Array.from(crypto.getRandomValues(new Uint8Array(32)),n=>n.toString(16).padStart(2,'0')).join('');event.cookies.set('rose-gallery',token,{path:'/',httpOnly:true,sameSite:'lax',secure:event.url.protocol==='https:',maxAge:31536000});return token;}
export async function actor(event:RequestEvent){if(event.locals.user)return {id:event.locals.user.id,guest:false};if(event.locals.authUnavailable)error(503,'Your account connection is temporarily unavailable. Please try again.');const token=guestToken(event);if(!token)error(401,'Open the installed app to try your first free design.');return {id:await hash(token),guest:true};}
export function plan(event:RequestEvent){const metadata=event.locals.user?.app_metadata;const until=metadata?.rose_premium_until;const premium=metadata?.rose_plan==='premium'&&typeof until==='string'&&Date.parse(until)>Date.now();return premium?'premium':'free';}
export function dayWindow(now=Date.now()){const day=new Date(now).toISOString().slice(0,10),start=Date.parse(`${day}T00:00:00Z`);return {day,start,end:start+86400000};}
export async function reserveInspiration(event:RequestEvent){
 const who=await actor(event),{db}=storage(event),{day}=dayWindow(),now=Date.now(),limit=who.guest?3:plan(event)==='premium'?40:20;
 const row=await db.prepare(`INSERT INTO inspiration_attempts (id,owner,day,created,guest)
 SELECT ?,?,?,?,? WHERE (SELECT COUNT(*) FROM inspiration_attempts WHERE owner = ? AND (? = 1 OR day = ?)) < ?
 AND (SELECT COUNT(*) FROM inspiration_attempts WHERE day = ?) < 1000
 AND NOT EXISTS (SELECT 1 FROM inspiration_attempts WHERE owner = ? AND created > ?) RETURNING id`).bind(crypto.randomUUID(),who.id,day,now,who.guest?1:0,who.id,who.guest?1:0,day,limit,day,who.id,now-10000).first();
 if(!row)error(429,'Inspiration is taking a little break. Try again later, or write your own idea.');
}
export async function allowance(event:RequestEvent){const who=await actor(event),{db}=storage(event),window=dayWindow(),tier=who.guest?'guest':plan(event);const row=await db.prepare(`SELECT
 (SELECT COUNT(*) FROM generation_attempts WHERE owner = ? AND status != 'failed' AND (? = 1 OR day = ?)) +
 (SELECT COUNT(*) FROM designs d WHERE owner = ? AND (? = 1 OR (created >= ? AND created < ?)) AND NOT EXISTS (SELECT 1 FROM generation_attempts a WHERE a.request_id = d.id)) AS used`).bind(who.id,who.guest?1:0,window.day,who.id,who.guest?1:0,window.start,window.end).first<{used:number}>();const limit=tier==='guest'?1:tier==='premium'?20:5;return {tier,used:row?.used||0,limit,remaining:Math.max(0,limit-(row?.used||0)),resetAt:who.guest?null:window.end};}
export async function reserveGeneration(event:RequestEvent){
 const who=await actor(event),{db}=storage(event),window=dayWindow(),limit=who.guest?1:plan(event)==='premium'?20:5;
 const network=await hash(`${event.platform?.env.FAL_API_KEY||'rose-network'}:${window.day}:${event.request.headers.get('cf-connecting-ip')||event.getClientAddress()}`);
 const id=crypto.randomUUID(),now=Date.now(),globalLimit=Math.max(1,Math.min(10000,Number(event.platform?.env.DAILY_STUDIO_LIMIT)||250));
 const row=await db.prepare(`INSERT INTO generation_attempts (id,owner,day,created,status,network,guest)
 SELECT ?,?,?,?,'reserved',?,? WHERE
 (SELECT COUNT(*) FROM generation_attempts WHERE owner = ? AND status != 'failed' AND (? = 1 OR day = ?)) +
 (SELECT COUNT(*) FROM designs d WHERE owner = ? AND (? = 1 OR (created >= ? AND created < ?)) AND NOT EXISTS (SELECT 1 FROM generation_attempts a WHERE a.request_id = d.id)) < ?
 AND (SELECT COUNT(*) FROM generation_attempts WHERE day = ? AND status != 'failed') < ?
 AND (? = 0 OR (SELECT COUNT(*) FROM generation_attempts WHERE network = ? AND day = ? AND guest = 1 AND status != 'failed') < 2)
 AND NOT EXISTS (SELECT 1 FROM generation_attempts WHERE owner = ? AND status IN ('reserved','submitted') AND created > ?)
 RETURNING id`).bind(id,who.id,window.day,now,network,who.guest?1:0,who.id,who.guest?1:0,window.day,who.id,who.guest?1:0,window.start,window.end,limit,window.day,globalLimit,who.guest?1:0,network,window.day,who.id,now-1800000).first<{id:string}>();
 if(!row){const current=await allowance(event);if(current.remaining===0)error(who.guest?401:429,who.guest?'Your free preview is used. Create an account to keep creating and download your look.':`Your ${current.tier} plan includes ${current.limit} designs per day. Your allowance resets at midnight UTC.`);error(429,'A preview may still be in progress, or the studio is at capacity. Please try again later.');}
 return {id,owner:who.id};
}
