import { env } from '$env/dynamic/private';import { plan } from '$lib/server/access';import type {PageServerLoad} from './$types';
export const load:PageServerLoad=event=>({tier:plan(event),premiumUntil:event.locals.user?.app_metadata.rose_premium_until||null,checkoutUrl:env.PREMIUM_CHECKOUT_URL||''});
