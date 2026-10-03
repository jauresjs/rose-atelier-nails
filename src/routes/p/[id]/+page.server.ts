import { pollData } from '$lib/server/polls';import type { PageServerLoad } from './$types';
export const load:PageServerLoad=async event=>({poll:await pollData(event,event.params.id),url:event.url.origin+event.url.pathname});
