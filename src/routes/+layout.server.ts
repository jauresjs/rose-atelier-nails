import type { LayoutServerLoad } from './$types';
export const load:LayoutServerLoad=({locals})=>({lang:locals.lang,user:locals.user?{id:locals.user.id,email:locals.user.email??''}:null});
