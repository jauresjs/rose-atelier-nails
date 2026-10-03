import { json } from '@sveltejs/kit';
import { allowance } from '$lib/server/access';
import type { RequestHandler } from './$types';
export const GET:RequestHandler=async event=>json(await allowance(event),{headers:{'Cache-Control':'private, no-store'}});
