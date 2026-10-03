import { json,redirect } from '@sveltejs/kit';
import type { Handle } from '@sveltejs/kit';
import { authClient } from '$lib/server/auth';

export const handle:Handle=async({event,resolve})=>{
 event.locals.supabase=authClient(event);event.locals.user=null;event.locals.authUnavailable=!event.locals.supabase;
 if(event.locals.supabase&&event.cookies.getAll().some(c=>c.name==='rose-auth'||/^rose-auth\.\d+$/.test(c.name))){
  try{const {data,error}=await event.locals.supabase.auth.getUser();if(error){event.locals.authUnavailable=error.status===0||!!error.status&&error.status>=500;}else event.locals.user=data.user;}
  catch{event.locals.authUnavailable=true;}
 }
 const path=event.url.pathname;
 if((path==='/gallery'||path==='/auth/password'||path==='/polls')&&!event.locals.user)redirect(303,`/login?next=${encodeURIComponent(path)}`);
 if((path.startsWith('/api/gallery')||path==='/api/polls'||path.startsWith('/api/polls/manage/'))&&!event.locals.user)return json({message:event.locals.authUnavailable?'Your account connection is temporarily unavailable. Please try again.':'Please sign in to continue.'},{status:event.locals.authUnavailable?503:401,headers:{'Cache-Control':'private, no-store'}});
 const response=await resolve(event);response.headers.set('Cache-Control','private, no-store');return response;
};
