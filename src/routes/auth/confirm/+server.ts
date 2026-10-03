import { redirect } from '@sveltejs/kit';
import { safeNext,claimGuestGallery,clearPreviewCookies } from '$lib/server/auth';
import type { EmailOtpType } from '@supabase/supabase-js';
import type { RequestHandler } from './$types';
export const GET:RequestHandler=async event=>{
 const hash=event.url.searchParams.get('token_hash'),type=event.url.searchParams.get('type'),next=type==='recovery'?'/auth/password':safeNext(event.url.searchParams.get('next'));
 if(hash&&type&&['email','signup','recovery'].includes(type)&&event.locals.supabase){const {data,error}=await event.locals.supabase.auth.verifyOtp({token_hash:hash,type:type as EmailOtpType});if(!error&&data.user){await claimGuestGallery(event,data.user.id);clearPreviewCookies(event);redirect(303,next);}}
 redirect(303,'/login?notice=expired');
};
