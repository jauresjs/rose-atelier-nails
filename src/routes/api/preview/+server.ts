import { json, error, isHttpError } from '@sveltejs/kit';
import { client, MODEL, sameOrigin, credentials, signature, verifyJob } from '$lib/server/fal';
import type { RequestHandler } from './$types';
import { shapes } from '$lib/shapes';
import { owner,storage,saveResult } from '$lib/server/gallery';
import { reserveGeneration } from '$lib/server/access';
export const POST: RequestHandler = async event => {
 sameOrigin(event);
 const fal = client(event);
 const prior = event.cookies.get('rose-job');
 if(prior) {
  try { const id = await verifyJob(event); const state = await fal.queue.status(MODEL, { requestId:id }); if(state.status !== 'COMPLETED') error(409, 'Your previous design is still being created.'); const {db}=storage(event);await db.prepare('UPDATE generation_attempts SET status = ? WHERE request_id = ? AND owner = ?').bind('completed',id,await owner(event)).run(); }
  catch(e) { if(isHttpError(e) && e.status === 409) throw e; }
 }
 if(Number(event.request.headers.get('content-length') || 0) > 3_000_000) error(413, 'Please choose a smaller photo.');
 const raw = await event.request.text();
 if(raw.length > 3_000_000) error(413, 'Please choose a smaller photo.');
 let body;
 try { body = JSON.parse(raw); } catch { error(400, 'This photo could not be read. Please upload it again.'); }
 const { image, prompt, width, height } = body ?? {};
 const shape=shapes.find(s=>s.name===body?.shape);
 if(!shape)error(400,'Choose a nail shape.');
 const {db}=storage(event);const user=await owner(event);
 await db.prepare('SELECT id FROM designs WHERE owner = ? LIMIT 1').bind(user).first();
 if(typeof prompt !== 'string' || prompt.trim().length < 3 || prompt.length > 700) error(400, 'Describe your design in 3–700 characters.');
 if(typeof image !== 'string' || !/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/]+=*$/.test(image) || image.length > 2_800_000) error(400, 'Upload a JPEG, PNG, or WebP photo.');
 if(!Number.isInteger(width) || !Number.isInteger(height) || width < 512 || height < 512 || width > 1536 || height > 1536 || width * height > 1_100_000) error(400, 'Please upload your photo again.');
 const reservation=await reserveGeneration(event);
 try {
  const result = await fal.queue.submit(MODEL, { input: { image_urls:[image], prompt:`Edit the manicure in this exact photo. Nail shape and length: ${shape.description}. Apply this nail art to all visible fingernail surfaces: ${prompt.trim()}. Preserve the original finger count, hand anatomy, hand pose, skin tone, jewelry, lighting, shadows, camera framing and background. Keep the design confined to the fingernails, with realistic polish sheen and perspective. Do not add text, logos, extra fingers or accessories.`, image_size:{width,height}, num_images:1, enable_safety_checker:true, enable_prompt_expansion:false, output_format:'jpeg' } });
  const timestamp = String(Date.now());
  const sig = await signature(`${result.request_id}.${timestamp}.${user}`, credentials(event));
  event.cookies.set('rose-job', `${result.request_id}.${timestamp}.${sig}`, { path:'/api/preview', httpOnly:true, sameSite:'strict', secure:event.url.protocol === 'https:', maxAge:1800 });
  event.cookies.set('rose-job-details',JSON.stringify({id:result.request_id,reservation:reservation.id,prompt:prompt.trim(),shape:shape.name,created:Date.now()}),{path:'/api/preview',httpOnly:true,sameSite:'strict',secure:event.url.protocol==='https:',maxAge:1800});
  try{await db.prepare('UPDATE generation_attempts SET status = ?, request_id = ? WHERE id = ?').bind('submitted',result.request_id,reservation.id).run();}catch{console.error('Generation tracking will retry on preview check');}
  try{await db.prepare('INSERT INTO designs (id, owner, prompt, shape, created) VALUES (?, ?, ?, ?, ?)').bind(result.request_id,user,prompt.trim(),shape.name,Date.now()).run();}catch(e){console.error('Gallery metadata save failed',e instanceof Error?e.message:'storage error');}
  return json({ status:'IN_QUEUE' }, { headers:{ 'Cache-Control':'no-store' } });
 } catch(e) { const status=(e as {status?:number})?.status;await db.prepare('UPDATE generation_attempts SET status = ? WHERE id = ? AND request_id IS NULL').bind(status&&status>=400&&status<500?'failed':'unknown',reservation.id).run();error(502, 'We couldn’t confirm your design. Please check for a result before trying again.'); }
};
export const GET: RequestHandler = async event => {
 const id = await verifyJob(event);
 const fal = client(event);
 try {
  const state = await fal.queue.status(MODEL, { requestId:id });
  if(state.status !== 'COMPLETED') return json({ status:state.status }, {headers:{'Cache-Control':'no-store'}});
  const {db}=storage(event);const details=event.cookies.get('rose-job-details');let reservation='';try{reservation=details?JSON.parse(details).reservation||'':'';}catch{ /* Older jobs have no reservation cookie. */ }
  await db.prepare('UPDATE generation_attempts SET status = ?, request_id = ? WHERE (request_id = ? OR id = ?) AND owner = ?').bind('completed',id,id,reservation,await owner(event)).run();
  const result = await fal.queue.result(MODEL, { requestId:id });
  const data = result.data as {images?:{url:string}[];has_nsfw_concepts?:boolean[]};
  if(data.has_nsfw_concepts?.some(Boolean)) { event.cookies.delete('rose-job', {path:'/api/preview'}); error(422, 'Please try another hand photo or a different design.'); }
  const url = data.images?.[0]?.url;
  if(!url || !url.startsWith('https://')) { event.cookies.delete('rose-job', {path:'/api/preview'}); error(502, 'The preview was empty. Please try a different photo.'); }
  let image=url,galleryWarning='';
  try{const details=event.cookies.get('rose-job-details');if(details){const d=JSON.parse(details);if(d.id===id&&typeof d.prompt==='string'&&d.prompt.length<=700&&shapes.some(s=>s.name===d.shape)&&Number.isFinite(d.created)){const {db}=storage(event);await db.prepare('INSERT OR IGNORE INTO designs (id, owner, prompt, shape, created) VALUES (?, ?, ?, ?, ?)').bind(id,await owner(event),d.prompt,d.shape,d.created).run();}}const saved=await saveResult(event,id,url);if(saved)image=saved;else galleryWarning='Your design is ready, but this older image could not be added to your gallery.';}catch(e){console.error('Gallery image save failed',e instanceof Error?e.message:'storage error');galleryWarning='Your design is ready. Gallery saving failed—tap Check design to retry.';}
  // Guests see a preview through an owned endpoint; never expose the provider's download URL.
  if(!event.locals.user&&image===url)error(503,'Your design is ready but is still being saved. Tap Check design in a moment.');
  return json({status:'COMPLETED',image:event.locals.user?image:`/api/preview/image?id=${encodeURIComponent(id)}`,galleryWarning}, {headers:{'Cache-Control':'no-store'}});
 } catch(e) { if(isHttpError(e)) throw e; error(502, 'Your design could not be checked. Tap Check design to try again.'); }
};
