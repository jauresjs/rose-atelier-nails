declare global {
 namespace App {
  interface Locals {supabase:import('@supabase/supabase-js').SupabaseClient|null;user:import('@supabase/supabase-js').User|null;authUnavailable:boolean}
  interface Platform { env: { DAILY_STUDIO_LIMIT?:string;SUPABASE_URL?:string;SUPABASE_ANON_KEY?:string;FAL_API_KEY?: string; FAL_KEY?: string; DB?:import('$lib/server/gallery').Database; BUCKET?:import('$lib/server/gallery').Bucket }; ctx: { waitUntil(p: Promise<unknown>): void } }
 }
 interface Document { modelContext?: { registerTool(tool: {name:string;title?:string;description:string;inputSchema:object;annotations?:object;execute:(input:unknown)=>unknown}, options?:{signal:AbortSignal}): void | Promise<void> } }
}
export {};
