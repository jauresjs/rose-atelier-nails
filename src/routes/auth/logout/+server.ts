import { redirect,error } from '@sveltejs/kit';
import { sameOrigin } from '$lib/server/fal';
import { clearPreviewCookies } from '$lib/server/auth';
import type { RequestHandler } from './$types';
export const POST:RequestHandler=async event=>{sameOrigin(event);if(event.locals.supabase){const {error:problem}=await event.locals.supabase.auth.signOut({scope:'local'});if(problem)error(503,'Sign out could not complete. Please try again.');}for(const cookie of event.cookies.getAll())if(cookie.name==='rose-auth'||cookie.name.startsWith('rose-auth.'))event.cookies.delete(cookie.name,{path:'/'});event.cookies.delete('rose-auth-next',{path:'/auth'});clearPreviewCookies(event);redirect(303,'/login?notice=signed-out');};
