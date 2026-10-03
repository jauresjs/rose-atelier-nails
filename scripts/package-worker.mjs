import { cp, mkdir, unlink } from 'node:fs/promises';
import { build } from 'esbuild';
await mkdir('dist/server', { recursive: true });
await cp('.svelte-kit/cloudflare', 'dist/client', { recursive: true });
await build({ entryPoints:['scripts/worker-entry.mjs'], outfile:'dist/server/index.js', bundle:true, format:'esm', platform:'browser', target:'es2022', external:['cloudflare:workers','node:*'], minify:true });
await unlink('dist/client/_worker.js');
