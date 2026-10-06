import { error,redirect } from '@sveltejs/kit';
import { storage } from '$lib/server/gallery';
import type { PageServerLoad } from './$types';
export const load:PageServerLoad=async event=>{
 const {db}=storage(event),profile=await db.prepare('SELECT owner,display_name,slug FROM poll_profiles WHERE slug = ? COLLATE NOCASE').bind(event.params.slug).first<{owner:string;display_name:string;slug:string}>();
 if(!profile)error(404,'This poll page could not be found.');
 if(event.params.slug!==profile.slug)redirect(308,`/${profile.slug}`);
 const rows=await db.prepare(`SELECT p.id,p.title,p.created,p.closed,(SELECT COUNT(*) FROM poll_votes v WHERE v.poll_id = p.id) AS votes FROM polls p WHERE p.owner = ? ORDER BY p.created DESC`).bind(profile.owner).all<{id:string;title:string;created:number;closed:number|null;votes:number}>();
 return {origin:event.url.origin,profile:{displayName:profile.display_name,slug:profile.slug},polls:rows.results.map(p=>({...p,image:`/api/polls/${p.id}/image/0`}))};
};
