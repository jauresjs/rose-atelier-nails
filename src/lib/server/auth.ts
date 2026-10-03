import { createServerClient } from '@supabase/ssr';
import { env } from '$env/dynamic/private';
import { error } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';

export function authConfig(event:RequestEvent){
 const url=event.platform?.env.SUPABASE_URL||env.SUPABASE_URL;
 const key=event.platform?.env.SUPABASE_ANON_KEY||env.SUPABASE_ANON_KEY;
 return url&&key?{url,key}:null;
}
export function authClient(event:RequestEvent){
 const config=authConfig(event);if(!config)return null;
 return createServerClient(config.url,config.key,{
  cookieOptions:{name:'rose-auth',path:'/',sameSite:'lax',secure:event.url.protocol==='https:',httpOnly:true},
  global:{fetch:(input,init)=>fetch(input,{...init,signal:AbortSignal.timeout(15000)})},
  cookies:{getAll:()=>event.cookies.getAll(),setAll:cookies=>{for(const {name,value,options} of cookies)event.cookies.set(name,value,{...options,path:'/',httpOnly:true,sameSite:'lax',secure:event.url.protocol==='https:'});}}
 });
}
export function requireAuth(event:RequestEvent){
 if(event.locals.authUnavailable)error(503,'Your account connection is temporarily unavailable. Please try again.');
 if(!event.locals.user)error(401,'Please sign in to open your nail studio.');
 return event.locals.user;
}
export function safeNext(value:string|null){return value==='/gallery'?'/gallery':value==='/polls'?'/polls':value==='/premium'?'/premium':value==='/auth/password'?'/auth/password':'/studio';}
export function rememberNext(event:RequestEvent,next:string){event.cookies.set('rose-auth-next',safeNext(next),{path:'/auth',httpOnly:true,sameSite:'lax',secure:event.url.protocol==='https:',maxAge:3600});}
export function clearPreviewCookies(event:RequestEvent){event.cookies.delete('rose-job',{path:'/api/preview'});event.cookies.delete('rose-job-details',{path:'/api/preview'});}
export async function claimGuestGallery(event:RequestEvent,userId:string){
 const token=event.cookies.get('rose-gallery');if(!token||!/^[a-f0-9]{64}$/.test(token))return;
 if(!event.platform?.env.DB)return;
 const hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(token))),n=>n.toString(16).padStart(2,'0')).join('');
 try{const db=event.platform.env.DB;await db.batch([db.prepare('UPDATE designs SET owner = ? WHERE owner = ?').bind(userId,hash),db.prepare('UPDATE generation_attempts SET owner = ?, guest = 0 WHERE owner = ?').bind(userId,hash)]);event.cookies.delete('rose-gallery',{path:'/'});}catch{console.error('Could not move guest gallery into account');}
}
export function authMessage(code?:string){
 switch(code){
  case 'invalid_credentials':return 'That email and password don’t match. Please try again.';
  case 'email_not_confirmed':return 'Check your inbox and confirm your email before signing in.';
  case 'user_already_exists':return 'This email already has an account. Try signing in.';
  case 'weak_password':return 'Choose a stronger password with at least 8 characters.';
  case 'over_email_send_rate_limit':case 'over_request_rate_limit':return 'A few too many attempts. Please wait a moment and try again.';
  case 'email_address_not_authorized':return 'Email delivery is not configured for this address yet. Please contact the studio owner.';
  case 'signup_disabled':return 'New accounts are temporarily unavailable. Please try again later.';
  default:return 'We couldn’t complete that request. Please try again in a moment.';
 }
}
