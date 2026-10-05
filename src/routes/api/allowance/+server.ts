import { json } from '@sveltejs/kit';
import { allowance,appOnly } from '$lib/server/access';
import { requireAuth } from '$lib/server/auth';
import type { RequestHandler } from './$types';
export const GET:RequestHandler=async event=>{requireAuth(event);appOnly(event);return json(await allowance(event),{headers:{'Cache-Control':'private, no-store'}});};
