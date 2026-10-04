/// <reference lib="webworker" />
import { build, files, version } from '$service-worker';
const sw = self as unknown as ServiceWorkerGlobalScope;
const CACHE = `rose-${version}`;
const ASSETS = [...build, ...files].filter(path => !path.includes('manicure'));
let preferredLanguage=navigator.language?.toLowerCase().startsWith('fr')?'fr':'en';
sw.addEventListener('message',event=>{if(event.data?.type==='rose-language'&&(event.data.language==='fr'||event.data.language==='en')){preferredLanguage=event.data.language;event.waitUntil(caches.open(CACHE).then(cache=>cache.put('/__rose_language__',new Response(preferredLanguage))));}});
async function offlinePage(){const cached=await (await caches.open(CACHE)).match('/__rose_language__');const language=cached?await cached.text():preferredLanguage,fr=language==='fr';return new Response(`<!doctype html><html lang="${fr?'fr':'en'}"><meta name="viewport" content="width=device-width"><title>Rose Atelier — ${fr?'Hors ligne':'Offline'}</title><body style="background:#fff7fa;color:#6b2844;font:18px system-ui;padding:10vw"><h1>${fr?'Ton atelier revient dans un instant.':'Your studio will be right back.'}</h1><p>${fr?'Connecte-toi à Internet pour ouvrir ton atelier et créer un aperçu.':'Connect to the internet to open your nail studio and generate a preview.'}</p><button onclick="location.reload()" style="padding:16px;border:0;border-radius:24px;background:#a92354;color:white">${fr?'Réessayer':'Try again'}</button></body></html>`,{headers:{'Content-Type':'text/html; charset=utf-8','Content-Language':fr?'fr':'en'}});}
sw.addEventListener('install', event => { event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ASSETS))); });
sw.addEventListener('activate', event => { event.waitUntil((async () => { for (const key of await caches.keys()) if(key.startsWith('rose-') && key !== CACHE) await caches.delete(key); await sw.clients.claim(); })()); });
sw.addEventListener('fetch', event => {
 const request = event.request;
 const url = new URL(request.url);
 if(request.method !== 'GET' || url.origin !== sw.location.origin || url.pathname.startsWith('/api/')) return;
 if(ASSETS.includes(url.pathname)) event.respondWith(caches.open(CACHE).then(async cache => (await cache.match(request)) || fetch(request)));
 else if(request.mode === 'navigate') event.respondWith(fetch(request).catch(offlinePage));
});
