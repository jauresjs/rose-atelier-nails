import { fail,redirect } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { safeNext } from '$lib/server/auth';
import { plan } from '$lib/server/access';
import type { Actions,PageServerLoad } from './$types';

export const load:PageServerLoad=event=>{
 if(!event.locals.user)redirect(303,`/login?next=${encodeURIComponent('/profile')}`);
 return {name:typeof event.locals.user.user_metadata?.full_name==='string'?event.locals.user.user_metadata.full_name:'',email:event.locals.user.email??'',next:safeNext(event.url.searchParams.get('next')),tier:plan(event),premiumUntil:event.locals.user.app_metadata.rose_premium_until||null,checkoutUrl:env.PREMIUM_CHECKOUT_URL||''};
};

export const actions:Actions={
 default:async event=>{
  const user=event.locals.user;if(!user||!event.locals.supabase)redirect(303,'/login?next=%2Fprofile');
  const form=await event.request.formData(),name=String(form.get('name')||'').trim(),next=safeNext(String(form.get('next')||''));
  if(name.length<1||name.length>80)return fail(400,{name,message:'Enter a name of 1 to 80 characters.'});
  const {error}=await event.locals.supabase.auth.updateUser({data:{full_name:name}});
  if(error)return fail(503,{name,message:'Your name could not be saved. Please try again.'});
  redirect(303,next);
 }
};
