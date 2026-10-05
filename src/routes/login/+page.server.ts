import { fail,redirect } from '@sveltejs/kit';
import { authConfig,authMessage,safeNext,claimGuestGallery,clearPreviewCookies,rememberNext } from '$lib/server/auth';
import type { Actions,PageServerLoad } from './$types';
import type { RequestEvent } from '@sveltejs/kit';

export const load:PageServerLoad=async event=>{
 const next=safeNext(event.url.searchParams.get('next'));if(event.locals.user)redirect(303,event.locals.user.user_metadata?.full_name?next:`/profile?next=${encodeURIComponent(next)}`);
 let googleEnabled=false;const config=authConfig(event);
 if(config)try{const response=await event.fetch(`${config.url}/auth/v1/settings`,{headers:{apikey:config.key},signal:AbortSignal.timeout(10000)});if(response.ok)googleEnabled=!!(await response.json()).external?.google;}catch{}
 const notice=event.url.searchParams.get('notice');
 return {next,initialMode:event.url.searchParams.get('mode')==='signup'?'signup':'signin',googleEnabled,configured:!!config,notice:notice==='expired'?'That link has expired or was already used. Request a new one and try again.':notice==='oauth'?'Google sign-in was not completed. Please try again.':notice==='signed-out'?'You’re signed out. See you soon, lovely.':notice==='password-updated'?'Your password is updated. Sign in with your new password.':''};
};
async function fields(event:RequestEvent,mode:string){
 const form=await event.request.formData(),email=String(form.get('email')||'').trim().toLowerCase(),password=String(form.get('password')||''),next=safeNext(String(form.get('next')||''));
 if(!event.locals.supabase||event.locals.authUnavailable)return {failure:fail(503,{mode,email,message:'Your account connection is temporarily unavailable. Please try again.'})};
 if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||email.length>254)return {failure:fail(400,{mode,email,message:'Enter a valid email address.'})};
 if(mode!=='reset'&&(password.length<(mode==='signup'?8:1)||password.length>128))return {failure:fail(400,{mode,email,message:mode==='signup'?'Choose a password with 8–128 characters.':'Enter your password.'})};
 return {email,password,next,client:event.locals.supabase};
}
export const actions:Actions={
 signin:async event=>{const f=await fields(event,'signin');if(f.failure)return f.failure;const {data,error}=await f.client!.auth.signInWithPassword({email:f.email!,password:f.password!});if(error)return fail(400,{mode:'signin',email:f.email,message:authMessage(error.code)});if(!data.user)return fail(400,{mode:'signin',email:f.email,message:'Please try signing in again.'});await claimGuestGallery(event,data.user.id);clearPreviewCookies(event);redirect(303,data.user.user_metadata?.full_name?f.next!:`/profile?next=${encodeURIComponent(f.next!)}`);},
 signup:async event=>{const f=await fields(event,'signup');if(f.failure)return f.failure;rememberNext(event,f.next!);const {data,error}=await f.client!.auth.signUp({email:f.email!,password:f.password!,options:{emailRedirectTo:`${event.url.origin}/auth/callback`}});if(error)return fail(400,{mode:'signup',email:f.email,message:authMessage(error.code)});if(data.session&&data.user){await claimGuestGallery(event,data.user.id);clearPreviewCookies(event);redirect(303,`/profile?next=${encodeURIComponent(f.next!)}`);}return {mode:'signup',email:f.email,success:'Check your inbox for a confirmation link. Once confirmed, your little atelier is ready.'};},
 reset:async event=>{const f=await fields(event,'reset');if(f.failure)return f.failure;rememberNext(event,'/auth/password');const {error}=await f.client!.auth.resetPasswordForEmail(f.email!,{redirectTo:`${event.url.origin}/auth/callback`});if(error)return fail(400,{mode:'reset',email:f.email,message:authMessage(error.code)});return {mode:'reset',email:f.email,success:'If an account exists for that email, a password reset link is on its way. Check your inbox.'};},
 google:async event=>{if(!event.locals.supabase)return fail(503,{mode:'signin',message:'Your account connection is temporarily unavailable.'});const form=await event.request.formData(),next=safeNext(String(form.get('next')||''));rememberNext(event,next);const {data,error}=await event.locals.supabase.auth.signInWithOAuth({provider:'google',options:{redirectTo:`${event.url.origin}/auth/callback`,skipBrowserRedirect:true,queryParams:{access_type:'online',prompt:'select_account'}}});if(error||!data.url)return fail(400,{mode:'signin',message:'Google sign-in is unavailable. Please use email or try again later.'});redirect(303,data.url);}
};
