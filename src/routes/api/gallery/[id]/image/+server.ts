import { error } from '@sveltejs/kit';
import { owner,storage } from '$lib/server/gallery';
import type { RequestHandler } from './$types';
export const GET:RequestHandler=async event=>{const {db,bucket}=storage(event);const row=await db.prepare('SELECT object_key FROM designs WHERE id = ? AND owner = ?').bind(event.params.id,await owner(event)).first<{object_key:string}>();if(!row?.object_key)error(404,'This design could not be found.');const file=await bucket.get(row.object_key);if(!file)error(404,'This image could not be found.');return new Response(file.body,{headers:{'Content-Type':file.httpMetadata?.contentType||'image/jpeg','Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'}});};
