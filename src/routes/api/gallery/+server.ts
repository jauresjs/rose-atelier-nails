import { json,error } from '@sveltejs/kit';
import { owner,storage } from '$lib/server/gallery';
import type { RequestHandler } from './$types';
import { dayWindow } from '$lib/server/access';
export const GET:RequestHandler=async event=>{try{const {db}=storage(event);const rows=await db.prepare('SELECT id, prompt, shape, created FROM designs WHERE owner = ? AND object_key IS NOT NULL ORDER BY created DESC LIMIT 100').bind(await owner(event)).all();const window=dayWindow();return json({designs:rows.results,todayStart:window.start,todayEnd:window.end},{headers:{'Cache-Control':'no-store'}});}catch(e){console.error('Gallery load failed',e instanceof Error?e.message:'storage error');error(503,'Your gallery could not load. Please try again.');}};
