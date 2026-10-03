/// <reference lib="webworker" />
import { build, files, version } from '$service-worker';
const sw = self as unknown as ServiceWorkerGlobalScope;
const CACHE = `rose-${version}`;
const ASSETS = [...build, ...files].filter(path => !path.includes('manicure'));
sw.addEventListener('install', event => { event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ASSETS))); });
sw.addEventListener('activate', event => { event.waitUntil((async () => { for (const key of await caches.keys()) if(key.startsWith('rose-') && key !== CACHE) await caches.delete(key); await sw.clients.claim(); })()); });
sw.addEventListener('fetch', event => {
 const request = event.request;
 const url = new URL(request.url);
 if(request.method !== 'GET' || url.origin !== sw.location.origin || url.pathname.startsWith('/api/')) return;
 if(ASSETS.includes(url.pathname)) event.respondWith(caches.open(CACHE).then(async cache => (await cache.match(request)) || fetch(request)));
 else if(request.mode === 'navigate') event.respondWith(fetch(request).catch(() => new Response('<!doctype html><html lang="en"><meta name="viewport" content="width=device-width"><title>Rose Atelier — Offline</title><body style="background:#fff7fa;color:#6b2844;font:18px system-ui;padding:10vw"><h1>Your studio will be right back.</h1><p>Connect to the internet to open your nail studio and generate a preview.</p><button onclick="location.reload()" style="padding:16px;border:0;border-radius:24px;background:#a92354;color:white">Try again</button></body></html>', { headers: { 'Content-Type':'text/html; charset=utf-8' } })));
});
