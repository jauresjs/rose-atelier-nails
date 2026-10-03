import { json } from '@sveltejs/kit';import { pollData } from '$lib/server/polls';import type { RequestHandler } from './$types';
export const GET:RequestHandler=async event=>json(await pollData(event,event.params.id),{headers:{'Cache-Control':'no-store'}});
