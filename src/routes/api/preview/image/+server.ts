import { error } from '@sveltejs/kit';
import { storage,owner } from '$lib/server/gallery';
import { requireAuth } from '$lib/server/auth';
import type { RequestHandler } from './$types';
export const GET:RequestHandler=async event=>{if(event.url.searchParams.has('download'))requireAuth(event);const {db,bucket}=storage(event),id=event.url.searchParams.get('id');const row=await db.prepare('SELECT object_key FROM designs WHERE id = ? AND owner = ?').bind(id,await owner(event)).first<{object_key:string}>();if(!row?.object_key)error(404,'This preview could not be found.');const file=await bucket.get(row.object_key);if(!file)error(404,'This preview could not be found.');return new Response(file.body,{headers:{'Content-Type':file.httpMetadata?.contentType||'image/jpeg','Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff',...(event.url.searchParams.has('download')?{'Content-Disposition':'attachment; filename="rose-atelier-manicure.jpg"'}:{})}});};
