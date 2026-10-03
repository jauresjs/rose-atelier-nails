import { env } from '$env/dynamic/private';
import { error } from '@sveltejs/kit';
import { createFalClient } from '@fal-ai/client';
import type { RequestEvent } from '@sveltejs/kit';
import { actor } from './access';
export const MODEL = 'fal-ai/flux-2/flash/edit';
export function credentials(event: RequestEvent) {
 const key = event.platform?.env?.FAL_API_KEY || event.platform?.env?.FAL_KEY || env.FAL_API_KEY || env.FAL_KEY;
 if (!key) error(503, 'The studio is waiting for its AI connection. Please try again later.');
 return key;
}
export function client(event: RequestEvent) { return createFalClient({ credentials: credentials(event) }); }
export function sameOrigin(event: RequestEvent) {
 if (event.request.headers.get('origin') !== event.url.origin) error(403, 'Please generate previews from your nail studio.');
}
export async function signature(id: string, key: string) {
 const signing = await crypto.subtle.importKey('raw', new TextEncoder().encode(key), { name:'HMAC', hash:'SHA-256' }, false, ['sign']);
 const bytes = new Uint8Array(await crypto.subtle.sign('HMAC', signing, new TextEncoder().encode(id)));
 return Array.from(bytes, n => n.toString(16).padStart(2, '0')).join('');
}
export async function verifyJob(event: RequestEvent) {
 const token = event.cookies.get('rose-job');
 if (!token) error(404, 'No preview is in progress.');
 const [id, timestamp, sig] = token.split('.');
 if(!id || !/^[a-zA-Z0-9-]{8,128}$/.test(id) || !timestamp || !sig || Date.now() - Number(timestamp) > 30 * 60_000 || Number(timestamp) > Date.now()) error(410, 'This preview session has expired. Please generate again.');
 const expected = await signature(`${id}.${timestamp}.${(await actor(event)).id}`, credentials(event));
 let difference = expected.length ^ sig.length;
 for(let i=0;i<expected.length;i++) difference |= expected.charCodeAt(i) ^ (sig.charCodeAt(i) || 0);
 if(difference !== 0) error(403, 'This preview session could not be verified.');
 return id;
}
