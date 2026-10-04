<script lang="ts">
 import { onMount } from 'svelte';
 import { fade, fly } from 'svelte/transition';
 import { Sparkles, Upload, Camera, Heart, X, Check, Download, RefreshCw, ImagePlus, ChevronDown, SlidersHorizontal, Smartphone, Flower2, LoaderCircle, WandSparkles } from 'lucide-svelte';
 import AppHeader from '$lib/AppHeader.svelte';
 import { shapes } from '$lib/shapes';
 import {page} from '$app/state';
 import {inInstalledApp,appHeaders,requestInstall} from '$lib/pwa';
 let installReady=$state(false);let installed=$state(false),appReady=$state(false),quota=$state<{tier:string;used:number;limit:number;remaining:number;resetAt:number|null}|null>(null);
 async function refreshQuota(){try{const r=await fetch('/api/allowance',{cache:'no-store'});if(r.ok)quota=await r.json();}catch{}}
 async function startApp(){installed=inInstalledApp();if(!installed||appReady)return;try{quota=await readResponse(await fetch('/api/app-session',{method:'POST',headers:appHeaders()}));appReady=true;const r=await fetch('/api/preview',{cache:'no-store'});if(!r.ok||original||busy)return;const data=await r.json();if(data.status==='COMPLETED'){result=data.image;mode='after';return;}busy=true;stage='Finishing your preview';pollStarted=Date.now();await poll();}catch(e){errorMessage=e instanceof Error?e.message:'Your studio could not open. Please try again.';}}
 let shape=$state(shapes[0].name);
 let inspiring=$state(false);let suggestions=$state<{name:string;summary:string;prompt:string}[]>([]);
 async function inspire(){if(inspiring||busy)return;if(!installed){requestInstall();return;}if(!appReady){await startApp();if(!appReady)return;}inspiring=true;errorMessage='';try{const data=await readResponse(await fetch('/api/inspire',{method:'POST',headers:appHeaders(),body:JSON.stringify({shape,prompt})}));suggestions=data.suggestions;}catch(e){errorMessage=e instanceof Error?e.message:'Inspiration could not load.';}finally{inspiring=false;}}

 let selected=$state('');let prompt=$state('');let finish=$state('Glossy');let color=$state('');
 let original=$state('');let result=$state('');let width=$state(1024);let height=$state(1024);
 let busy=$state(false);let reading=$state(false);let stage=$state('');let errorMessage=$state('');
 let compare=$state(50);let mode=$state<'after'|'compare'>('after');
 let toast=$state('');let downloading=$state(false);let online=$state(true);
 let fileInput:HTMLInputElement;let cameraInput:HTMLInputElement;let promptInput=$state<HTMLTextAreaElement>();
 let pollTimer:ReturnType<typeof setTimeout>;let toastTimer:ReturnType<typeof setTimeout>;let pollStarted=0;let failures=0;let disposed=false;
 const colors=[{name:'Ballet pink',value:'#efb4c8'},{name:'Cherry red',value:'#b72447'},{name:'Milk white',value:'#fff4e8'},{name:'Lavender',value:'#b7a0d3'},{name:'Mocha',value:'#987266'},{name:'Peach',value:'#f0ac90'}];
 function notify(message:string){toast=message;clearTimeout(toastTimer);toastTimer=setTimeout(()=>toast='',3500);}
 async function upload(file?:File){
  if(!file||busy)return;errorMessage='';
  if(!['image/jpeg','image/png','image/webp'].includes(file.type)){errorMessage='Choose a JPEG, PNG, or WebP photo. Export an iPhone HEIC photo as JPEG first.';return;}
  if(file.size>20*1024*1024){errorMessage='Choose a photo under 20 MB.';return;}reading=true;let url='';
  try{url=URL.createObjectURL(file);const img=new Image();img.src=url;await img.decode();
   if(img.width<128||img.height<128)throw new Error('Choose a clearer photo at least 128 pixels wide and tall.');
   const ratio=Math.max(.5,Math.min(2,img.width/img.height));width=Math.round(Math.sqrt(1_000_000*ratio)/16)*16;height=Math.round(width/ratio/16)*16;
   const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;const ctx=canvas.getContext('2d');if(!ctx)throw new Error('Your browser could not read this photo.');
   ctx.fillStyle='#fff';ctx.fillRect(0,0,width,height);const scale=Math.min(width/img.width,height/img.height),w=img.width*scale,h=img.height*scale;ctx.drawImage(img,(width-w)/2,(height-h)/2,w,h);
   original=canvas.toDataURL('image/jpeg',.88);result='';mode='after';
  }catch(e){errorMessage=e instanceof Error?e.message:'This photo could not be opened. Try another one.';}
  finally{if(url)URL.revokeObjectURL(url);reading=false;if(fileInput)fileInput.value='';if(cameraInput)cameraInput.value='';}
 }
 async function sample(){if(busy)return;try{const r=await fetch('/manicure.jpg');if(!r.ok)throw new Error();await upload(new File([await r.blob()],'sample.jpg',{type:'image/jpeg'}));notify('Sample added. Make it your own.');}catch{errorMessage='The sample could not load. Try your own photo.';}}
 function clearPhoto(){if(busy)return;original='';result='';errorMessage='';}
 async function readResponse(response:Response){const data=await response.json().catch(()=>({message:'Something went wrong. Please try again.'}));if(!response.ok)throw new Error(data.message||'Something went wrong. Please try again.');return data;}
 async function generate(){
  if(busy||reading)return;errorMessage='';
  if(!installed){requestInstall();return;}if(!appReady){await startApp();if(!appReady)return;}
  if(quota&&!quota.remaining){if(!page.data.user){window.location.assign('/login?mode=signup&next=/studio');return;}errorMessage=`You’ve used your ${quota.limit} designs today. ${quota.tier==='free'?'Premium includes 20 a day.':'Your allowance resets at midnight UTC.'}`;return;}
  if(!original){errorMessage='Add a photo of your nails to begin.';return;}
  if(prompt.trim().length<3){errorMessage='Tell us a little about your dream manicure.';promptInput?.focus();return;}
  if(!navigator.onLine){errorMessage='Connect to the internet to create your preview.';return;}
  busy=true;stage='Sending your design';pollStarted=Date.now();failures=0;
  try{await readResponse(await fetch('/api/preview',{method:'POST',headers:appHeaders(),body:JSON.stringify({image:original,shape,prompt:`${prompt.trim()} Finish: ${finish}.${color?` Main polish color: ${color}.`:''}`,width,height})}));await refreshQuota();stage='Your manicure is taking shape';await poll();}
  catch(e){busy=false;errorMessage=e instanceof Error?e.message:'Your preview could not start.';}
 }
 async function poll(){
  if(disposed)return;if(Date.now()-pollStarted>600_000){busy=false;errorMessage='Your preview is taking longer than expected. Tap “Check preview” to look for the result.';return;}
  try{const response=await fetch('/api/preview',{cache:'no-store'});if(response.status>=500&&failures<3){failures++;pollTimer=setTimeout(poll,4000);return;}
   const data=await readResponse(response);failures=0;
   if(data.status==='COMPLETED'){const img=new Image();img.src=data.image;await img.decode();if(disposed)return;result=data.image;mode=original?'compare':'after';compare=50;busy=false;await refreshQuota();notify(data.galleryWarning||(page.data.user?'Your new manicure is saved in your gallery ♡':'Your first look is ready. Create an account to save and download it ♡'));return;}
   stage=data.status==='IN_QUEUE'?'Waiting for your turn':'Painting the little details';pollTimer=setTimeout(poll,2500);
  }catch(e){busy=false;errorMessage=e instanceof Error?e.message:'Connection interrupted. Tap “Check preview” to try again.';}
 }
 async function checkPreview(){if(busy)return;busy=true;stage='Checking your preview';pollStarted=Date.now();failures=0;errorMessage='';await poll();}
 async function saveImage(){if(!result||downloading)return;if(!page.data.user){window.location.assign('/login?mode=signup&next=/gallery');return;}downloading=true;try{const r=await fetch(result);if(!r.ok)throw new Error();const url=URL.createObjectURL(await r.blob());const a=document.createElement('a');a.href=url;a.download='rose-atelier-manicure.jpg';a.click();setTimeout(()=>URL.revokeObjectURL(url),10000);notify('Your manicure is ready to save.');}catch{errorMessage='Your look could not be downloaded. Please try again.';}finally{downloading=false;}}
 onMount(()=>{
  disposed=false;online=navigator.onLine;const onOnline=()=>online=true,onOffline=()=>online=false;
  window.addEventListener('online',onOnline);window.addEventListener('offline',onOffline);
  const installSync=()=>installReady=!!window.roseInstall?.prompt;installSync();window.addEventListener('rose-install-state',installSync);void startApp();const displayMode=matchMedia('(display-mode: standalone)');const displayChange=()=>{void startApp();};displayMode.addEventListener('change',displayChange);
  const lifecycle=new AbortController(),context=document.modelContext;
  if(context?.registerTool)try{Promise.resolve(context.registerTool({name:'set_nail_design',title:'Set nail design',description:'Set the nail design prompt without generating or spending credits.',inputSchema:{type:'object',properties:{prompt:{type:'string',minLength:3,maxLength:600}},required:['prompt'],additionalProperties:false},annotations:{readOnlyHint:false},execute(input){const p=(input as {prompt?:unknown})?.prompt;if(typeof p!=='string'||p.trim().length<3||p.length>600)throw new Error('Enter a design in 3–600 characters.');if(busy)throw new Error('A preview is in progress.');prompt=p;selected='';return{prompt,status:'staged'};}},{signal:lifecycle.signal})).catch(()=>{});}catch{}
  return()=>{disposed=true;clearTimeout(pollTimer);clearTimeout(toastTimer);lifecycle.abort();window.removeEventListener('rose-install-state',installSync);displayMode.removeEventListener('change',displayChange);window.removeEventListener('online',onOnline);window.removeEventListener('offline',onOffline);};
 });
</script>
<svelte:head><title>Rose Atelier — Your AI Nail Studio</title><meta name="description" content="Your nails, your imagination. Upload a hand photo and preview your dream manicure with AI."/><link rel="preconnect" href="https://fonts.googleapis.com"/><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous"/><link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Manrope:wght@400;500;600;700;800&family=Playfair+Display:ital,wght@0,500;0,600;0,700;1,500;1,600&display=swap" rel="stylesheet"/></svelte:head>
<div class="app-shell" class:has-ready={installed&&!!original&&prompt.trim().length>=3}>
 <AppHeader/>
 <main>
  <div class="intro" in:fly={{y:16,duration:600}}><div><span class="eyebrow"><Sparkles size={14}/> YOUR PERSONAL NAIL ATELIER</span><h1>A little polish.<br class="mobile-break"/> <i>A lot of you.</i></h1><p>Try your dream manicure on your own nails.</p></div><div class="intro-note"><span class="note-star">✧</span><span>Dream it.<br/>Try it. Love it.</span><Heart size={17}/></div></div>
  {#if !online}<div class="notice" role="status">You’re offline. Connect to the internet to create a preview.</div>{/if}
  {#if !installed}<section class="install-gate"><span class="auth-flower"><Smartphone size={27}/></span><span class="eyebrow">YOUR LITTLE POCKET ATELIER</span><h2>A home-screen shortcut<br/>to your next <i>obsession.</i></h2><p>Install Rose Atelier, then open it from your home screen to create your first nail design. Your first preview is free—no account needed.</p><button class="primary" onclick={requestInstall}><Smartphone size={18}/>{installReady?'Install my nail atelier':'Add my atelier to home screen'}</button><small>Already installed? Open the Rose Atelier icon on your home screen.</small><a href="/premium">Explore Free & Premium</a></section>{:else}
  {#if quota}<div class="allowance-bar"><span><Sparkles size={14}/>{quota.tier==='guest'?'Your first preview':quota.tier==='premium'?'Premium atelier':'Free atelier'}</span><b>{quota.remaining} / {quota.limit} {quota.tier==='guest'?'free preview':'designs left today'}</b>{#if quota.tier==='guest'}<a href="/login?mode=signup&next=/studio">Create account</a>{:else if quota.tier==='free'}<a href="/premium">Explore Premium</a>{/if}</div>{/if}
  {#if !appReady&&errorMessage}<div class="error-message" role="alert">{errorMessage}<button onclick={startApp}>Try again</button></div>{/if}
  <div class="how-it-works"><span>YOUR LITTLE RECIPE</span><p><b>01</b> Pick your nail shape <i>→</i> <b>02</b> Add a photo <i>→</i> <b>03</b> Describe your dream look</p></div>
  <div class="workspace">
   <section class="vibe-panel" aria-label="Choose nail shape and length"><div class="step-heading"><span class="step-number">01</span><div><h2>Find your perfect shape</h2><p>Keep your natural nails, or try a new silhouette.</p></div><Sparkles size={19}/></div><div class="shape-grid">{#each shapes as option}<button class="shape-card" class:selected={shape===option.name} aria-pressed={shape===option.name} onclick={()=>shape=option.name} disabled={busy}><span class={`nail-silhouette ${option.kind}`}></span><span>{option.name}</span>{#if shape===option.name}<Check size={14}/>{/if}</button>{/each}</div></section>
   <section class="preview-panel" aria-label="Nail photo preview"><div class="preview-top"><div class="step-heading"><span class="step-number">02</span><div><h2>{result?'Your new look':'Add your nail photo'}</h2><p>{original?'Your nails, your canvas.':'Or explore with our sample photo.'}</p></div></div></div>
    <div class="photo-stage" class:with-photo={!!original||!!result} class:generating={busy} ondragover={(e)=>e.preventDefault()} ondrop={(e)=>{e.preventDefault();upload(e.dataTransfer?.files[0]);}} role="region" aria-label="Photo canvas; drop a photo here">
     {#if result}<img src={result} alt="Your AI-generated nail design" class="canvas-image"/>{#if mode==='compare'&&original}<div class="before-layer" style={`clip-path:inset(0 ${100-compare}% 0 0)`}><img src={original} alt="Your original manicure" class="canvas-image"/></div><div class="compare-line" style={`left:${compare}%`}><span><SlidersHorizontal size={18}/></span></div><div class="image-label before-label">BEFORE</div><div class="image-label after-label">AFTER</div><input class="compare-range" type="range" min="0" max="100" bind:value={compare} aria-label="Before and after comparison"/>{/if}
     {:else if original}<img src={original} alt="Your original manicure" class="canvas-image"/>
     {:else}<img src="/manicure.jpg" alt="Inspiration: a glossy pale pink manicure" class="canvas-image inspiration"/><div class="sample-tag"><Sparkles size={13}/> A little nail inspiration</div><div class="photo-overlay"></div><div class="upload-card"><div class="upload-icon"><ImagePlus size={25} strokeWidth={1.5}/><span>+</span></div><h2>Let’s start with your nails</h2><p>A photo, a little imagination,<br/>and your next favorite manicure.</p><div class="photo-buttons"><button class="primary upload-btn" onclick={()=>fileInput.click()} disabled={reading}><Upload size={17}/>{reading?'Opening your photo…':'Upload your photo'}</button><button class="primary camera-btn" onclick={()=>cameraInput.click()} disabled={reading}><Camera size={17}/> Take a photo</button></div><div class="upload-actions"><button onclick={sample}>Just exploring? Try a sample</button></div><small>JPG, PNG or WebP · up to 20 MB</small></div>{/if}
     {#if original&&!busy}<button class="change-photo" onclick={()=>fileInput.click()}><ImagePlus size={16}/> Change photo</button><button class="remove-photo" onclick={clearPhoto} aria-label="Remove photo"><X size={17}/></button>{/if}
     {#if reading&&original}<div class="busy-overlay"><LoaderCircle class="spin" size={24}/><p>Preparing your photo…</p></div>{/if}
     {#if busy}<div class="busy-overlay" transition:fade><div class="magic-orbit"><Sparkles size={34} strokeWidth={1.3}/><span>✧</span></div><h2>A little magic in the making</h2><p>{stage}</p><div class="loading-track"><span></span></div><small>You can switch apps and come back.</small></div>{/if}
    </div>
    <div class="preview-bottom">{#if result}<div class="view-toggle"><button class:active={mode==='after'} onclick={()=>mode='after'}>New look</button><button class:active={mode==='compare'} onclick={()=>mode='compare'} disabled={!original}>Before / after</button></div><button class="save-btn" onclick={saveImage} disabled={downloading}><Download size={16}/>{downloading?'Saving…':'Save look'}</button>{:else}<span><Camera size={16}/> Natural light. One hand. Nails in focus.</span><Heart size={17} strokeWidth={1.5}/>{/if}</div>
   </section>
   <section class="design-panel" aria-label="Customize your nail design">
    <div class="step-heading"><span class="step-number">03</span><div><h2>Make it yours</h2><p>Dream up your own, or let us inspire you.</p></div><WandSparkles size={19} strokeWidth={1.5}/></div>
    <div class="prompt-heading"><label class="prompt-label" for="prompt">Describe your dream nails <span>♡</span></label><button class="inspire-btn" onclick={inspire} disabled={inspiring||busy||!online}>{#if inspiring}<LoaderCircle size={15} class="spin"/> Dreaming…{:else}<WandSparkles size={15}/> Inspire me{/if}</button></div>{#if suggestions.length}<div class="inspiration-list" aria-label="AI design suggestions">{#each suggestions as idea}<button class:selected={selected===idea.name} disabled={busy} onclick={()=>{prompt=idea.prompt;selected=idea.name;}}><span><b>{idea.name}</b><small>{idea.summary}</small></span><span>↗</span></button>{/each}<p>Pick an idea to fill your prompt, then make it your own.</p></div>{/if}<div class="prompt-box"><textarea id="prompt" bind:this={promptInput} bind:value={prompt} oninput={()=>selected=''} maxlength="600" disabled={busy} placeholder="Think soft pink French tips, tiny cherries, a little shimmer…" rows="3"></textarea><div class="prompt-foot"><span><Sparkles size={12}/> Little details make it personal</span><span>{prompt.length}/600</span></div></div>
    <div class="preferences"><div><label for="finish">The finish</label><div class="select-wrap"><select id="finish" bind:value={finish} disabled={busy}><option>Glossy</option><option>Matte</option><option>Pearlescent</option><option>Chrome</option><option>Glitter</option></select><ChevronDown size={15}/></div></div><fieldset><legend>A touch of color</legend><div class="color-swatches">{#each colors as swatch}<button type="button" style={`--color:${swatch.value}`} class:chosen={color===swatch.value} aria-label={swatch.name} aria-pressed={color===swatch.value} title={swatch.name} onclick={()=>color=color===swatch.value?'':swatch.value} disabled={busy}>{#if color===swatch.value}<Check size={13}/>{/if}</button>{/each}</div></fieldset></div>
    {#if errorMessage}<div class="error-message" role="alert" transition:fade><span>{errorMessage}</span><button onclick={()=>errorMessage=''} aria-label="Dismiss message"><X size={16}/></button></div>{/if}
    <button class="primary generate-btn" class:mobile-ready={!!original&&prompt.trim().length>=3} onclick={generate} disabled={busy||reading||!online}>{#if busy}<LoaderCircle size={19} class="spin"/>Creating your manicure…{:else}<Sparkles size={19}/>{result?'Dream up another look':'Preview my nails'}{/if}</button>
    <div class="generation-note"><span>Made for your nails. Dreamed up by you.</span><small>AI previews may vary from a salon result.</small></div>
    {#if errorMessage&&original}<button class="check-preview" onclick={checkPreview} disabled={busy}><RefreshCw size={14}/> Check preview</button>{/if}
   </section>
  </div>{#if result&&!page.data.user}<div class="guest-save-card"><Heart size={20}/><h2>Keep your first little obsession.</h2><p>Create a free account to download this look and make up to 5 designs a day.</p><a class="primary" href="/login?mode=signup&next=/gallery">Save my look & create an account</a></div>{/if}<div class="studio-footer"><span><Heart size={13}/> A tiny ritual. A little joy.</span><span>Your photo is sent to our AI provider only when you preview.</span></div>{/if}
 </main><footer class="site-footer"><span>rose <i>atelier</i></span><small>YOUR NEXT MANICURE, IMAGINED.</small><a href="https://unsplash.com/photos/vtQHwU4F13s" target="_blank" rel="noreferrer">Inspiration photo by Chelson Tamares</a></footer>
</div>
<input class="hidden-file" type="file" accept="image/jpeg,image/png,image/webp" bind:this={fileInput} onchange={(e)=>upload(e.currentTarget.files?.[0])} aria-label="Upload nail photo" tabindex="-1"/>
<input class="hidden-file" type="file" accept="image/jpeg,image/png,image/webp" capture="environment" bind:this={cameraInput} onchange={(e)=>upload(e.currentTarget.files?.[0])} aria-label="Take nail photo" tabindex="-1"/>
{#if toast}<div class="toast" role="status" transition:fly={{y:20,duration:250}}><Check size={16}/>{toast}</div>{/if}
