import type { Database } from './gallery';

type PollProfile={owner:string;display_name:string;slug:string};
const reserved=new Set(['api','assets','auth','favicon','gallery','login','manifest','p','polls','premium','profile','robots','service-worker','studio','well-known']);
function baseSlug(name:string){const slug=name.normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,48).replace(/-$/,'');return reserved.has(slug)?`${slug}-nails`:slug||'nail-lover';}
export async function ensurePollProfile(db:Database,owner:string,name:string):Promise<PollProfile>{
 const current=await db.prepare('SELECT owner,display_name,slug FROM poll_profiles WHERE owner = ?').bind(owner).first<PollProfile>();if(current)return current;
 const displayName=name.trim()||'Nail lover',base=baseSlug(displayName),ownerSuffix=owner.toLowerCase().replace(/[^a-z0-9]/g,'');
 for(let length=0;length<=ownerSuffix.length;length+=2){const candidate=length?`${base.slice(0,Math.max(1,47-length))}-${ownerSuffix.slice(0,length)}`:base;const existing=await db.prepare('SELECT owner FROM poll_profiles WHERE slug = ?').bind(candidate).first<{owner:string}>();if(existing)continue;
  try{await db.prepare('INSERT INTO poll_profiles (owner,display_name,slug) VALUES (?,?,?)').bind(owner,displayName,candidate).run();return {owner,display_name:displayName,slug:candidate};}
  catch{const raced=await db.prepare('SELECT owner,display_name,slug FROM poll_profiles WHERE owner = ?').bind(owner).first<PollProfile>();if(raced)return raced;}
 }
 throw new Error('A public poll address could not be reserved. Please try again.');
}
