import { json } from '@sveltejs/kit';
import { guestToken,allowance } from '$lib/server/access';
import { sameOrigin } from '$lib/server/fal';
import type { RequestHandler } from './$types';
export const POST:RequestHandler=async event=>{sameOrigin(event);if(!event.locals.user)guestToken(event,true);return json(await allowance(event),{headers:{'Cache-Control':'private, no-store'}});};
