import { fail,redirect } from '@sveltejs/kit';
import { requireAuth,authMessage,clearPreviewCookies } from '$lib/server/auth';
import type { Actions } from './$types';
export const actions:Actions={default:async event=>{requireAuth(event);const form=await event.request.formData(),password=String(form.get('password')||''),confirmation=String(form.get('confirmation')||'');if(password.length<8||password.length>128)return fail(400,{message:'Choose a password with 8–128 characters.'});if(password!==confirmation)return fail(400,{message:'Your passwords don’t match yet.'});const {error}=await event.locals.supabase!.auth.updateUser({password});if(error)return fail(400,{message:authMessage(error.code)});clearPreviewCookies(event);redirect(303,'/studio');}};
