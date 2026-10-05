import type { LayoutServerLoad } from './$types';
export const load:LayoutServerLoad=({locals})=>({lang:locals.lang,user:locals.user?{id:locals.user.id,email:locals.user.email??'',name:typeof locals.user.user_metadata?.full_name==='string'?locals.user.user_metadata.full_name:''}:null});
