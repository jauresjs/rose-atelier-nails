import { json } from '@sveltejs/kit';
import { allowance,appOnly } from '$lib/server/access';
import { sameOrigin } from '$lib/server/fal';
import { requireAuth } from '$lib/server/auth';
import type { RequestHandler } from './$types';
export const POST:RequestHandler=async event=>{sameOrigin(event);requireAuth(event);appOnly(event);return json(await allowance(event),{headers:{'Cache-Control':'private, no-store'}});};
