// Sites dispatch Workers cannot use Cloudflare's default cache.
// Serve SvelteKit directly instead of the adapter's cache-wrapped entrypoint.
import { Server } from '../.svelte-kit/output/server/index.js';
import { manifest } from '../.svelte-kit/cloudflare-tmp/manifest.js';
import { env as runtimeEnv } from 'cloudflare:workers';

const server = new Server(manifest);
let initialized;
export default {
 async fetch(request, env, ctx) {
  const pathname = new URL(request.url).pathname;
  const asset = pathname.slice(1);
  if (manifest.assets.has(asset) || pathname.startsWith('/_app/')) {
   return env.ASSETS.fetch(request);
  }
  initialized ??= server.init({ env: runtimeEnv });
  await initialized;
  return server.respond(request, {
   platform: { env, ctx, context: ctx },
   getClientAddress: () => request.headers.get('cf-connecting-ip') || '127.0.0.1'
  });
 }
};
