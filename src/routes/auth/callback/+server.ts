import { redirect } from '@sveltejs/kit';
import { safeNext,claimGuestGallery,clearPreviewCookies } from '$lib/server/auth';
import type { RequestHandler } from './$types';
export const GET:RequestHandler=async event=>{
 const next=safeNext(event.cookies.get('rose-auth-next')||event.url.searchParams.get('next')),code=event.url.searchParams.get('code');
 event.cookies.delete('rose-auth-next',{path:'/auth'});
 if(code&&event.locals.supabase){const {data,error}=await event.locals.supabase.auth.exchangeCodeForSession(code);if(!error&&data.user){await claimGuestGallery(event,data.user.id);clearPreviewCookies(event);redirect(303,data.user.user_metadata?.full_name?next:`/profile?next=${encodeURIComponent(next)}`);}}
 redirect(303,`/login?notice=${event.url.searchParams.has('error')?'oauth':'expired'}&next=${encodeURIComponent(next)}`);
};
