// Admin-only entitlement utility. This is not a billing checkout.
// SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/set-premium.mjs USER_UUID YYYY-MM-DD
// Use "free" instead of a date to revoke. Never run with an untrusted user ID.
import {createClient} from '@supabase/supabase-js';
const [id,expiry]=process.argv.slice(2);
if(!/^[a-f0-9-]{36}$/.test(id||'')||(!/^\d{4}-\d{2}-\d{2}$/.test(expiry||'')&&expiry!=='free'))throw new Error('Usage: set-premium.mjs USER_UUID YYYY-MM-DD|free');
const until=expiry==='free'?null:new Date(`${expiry}T23:59:59Z`).toISOString();
if(until&&Date.parse(until)<=Date.now())throw new Error('Premium expiry must be in the future');
const url=process.env.SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY;
if(!url||!key)throw new Error('Set server-only Supabase admin credentials in your environment');
const admin=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
const {data,error}=await admin.auth.admin.getUserById(id);if(error)throw new Error('Account could not be verified');
const updated=await admin.auth.admin.updateUserById(id,{app_metadata:{...data.user.app_metadata,rose_plan:until?'premium':'free',rose_premium_until:until}});
if(updated.error)throw new Error('Entitlement could not be updated');
console.log(`Account entitlement set to ${until?'Premium through '+expiry:'Free'}.`);
