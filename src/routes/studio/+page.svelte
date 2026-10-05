<script lang="ts">import {translate,dateLocale} from '$lib/i18n';const t=(text:string)=>translate(page.data.lang,text);
 import { onMount } from 'svelte';
 import { fade, fly } from 'svelte/transition';
 import { Sparkles, Upload, Camera, Heart, X, Check, Download, RefreshCw, ImagePlus, ChevronDown, SlidersHorizontal, Flower2, LoaderCircle, WandSparkles, Smartphone, UserRound, ArrowRight } from 'lucide-svelte';
 import AppHeader from '$lib/AppHeader.svelte';
 import { shapes } from '$lib/shapes';
 import {page} from '$app/state';
 import {appHeaders,inInstalledApp,requestInstall} from '$lib/pwa';
 let installed=$state(false),installReady=$state(false),appReady=$state(false),quota=$state<{tier:string;used:number;limit:number;remaining:number;resetAt:number|null}|null>(null);
 function syncInstallState(){installed=inInstalledApp();installReady=!!window.roseInstall?.prompt;}
 async function refreshQuota(){try{const r=await fetch('/api/allowance',{cache:'no-store',headers:appHeaders()});if(r.ok)quota=await r.json();}catch{}}
 async function startApp(){if(!installed||!page.data.user||appReady)return;try{quota=await readResponse(await fetch('/api/app-session',{method:'POST',headers:appHeaders()}));appReady=true;if(page.url.searchParams.get('sample')==='1'&&!original){await sample();return;}const r=await fetch('/api/preview',{cache:'no-store',headers:appHeaders()});if(!r.ok||original||busy)return;const data=await r.json();if(data.status==='COMPLETED'){result=data.image;mode='after';needsPhotoChoice=true;return;}busy=true;stage='Finishing your design';pollStarted=Date.now();await poll();}catch(e){errorMessage=e instanceof Error?e.message:'Your studio could not open. Please try again.';}}
 let shape=$state(shapes[0].name);
 let inspiring=$state(false);let suggestions=$state<{name:string;summary:string;prompt:string}[]>([]);
 async function inspire(){if(inspiring||busy)return;if(!installed){requestInstall();return;}if(!page.data.user){window.location.assign('/login?mode=signup&next=/studio');return;}if(!appReady){await startApp();if(!appReady)return;}inspiring=true;errorMessage='';try{const data=await readResponse(await fetch('/api/inspire',{method:'POST',headers:appHeaders(),body:JSON.stringify({shape,prompt})}));suggestions=data.suggestions;}catch(e){errorMessage=e instanceof Error?e.message:'Inspiration could not load.';}finally{inspiring=false;}}

 let selected=$state('');let prompt=$state('');let finish=$state('Glossy');let color=$state('');
 let original=$state('');let result=$state('');let needsPhotoChoice=$state(false);let width=$state(1024);let height=$state(1024);
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
   original=canvas.toDataURL('image/jpeg',.88);result='';mode='after';needsPhotoChoice=false;
  }catch(e){errorMessage=e instanceof Error?e.message:'This photo could not be opened. Try another one.';}
  finally{if(url)URL.revokeObjectURL(url);reading=false;if(fileInput)fileInput.value='';if(cameraInput)cameraInput.value='';}
 }
 async function sample(){if(busy)return;try{const r=await fetch('/manicure.jpg');if(!r.ok)throw new Error();await upload(new File([await r.blob()],'sample.jpg',{type:'image/jpeg'}));notify('Sample added. Make it your own.');}catch{errorMessage='The sample could not load. Try your own photo.';}}
 function clearPhoto(){if(busy)return;original='';result='';needsPhotoChoice=false;errorMessage='';}
 function reuseLastPhoto(){if(busy||!original)return;result='';mode='after';needsPhotoChoice=false;errorMessage='';}
 function takeNewPhoto(){if(!busy&&!reading)cameraInput.click();}
 async function readResponse(response:Response){const data=await response.json().catch(()=>({message:'Something went wrong. Please try again.'}));if(!response.ok)throw new Error(data.message||'Something went wrong. Please try again.');return data;}
 async function generate(){
  if(busy||reading||needsPhotoChoice)return;errorMessage='';
  if(!installed){requestInstall();return;}if(!page.data.user){window.location.assign('/login?mode=signup&next=/studio');return;}if(!appReady){await startApp();if(!appReady)return;}
  if(quota&&!quota.remaining){if(!page.data.user){window.location.assign('/login?mode=signup&next=/studio');return;}errorMessage=`You’ve used your ${quota.limit} designs today. ${quota.tier==='free'?'Premium includes 20 a day.':'Your allowance resets at midnight UTC.'}`;return;}
  if(!original){errorMessage='Add a photo of your nails to begin.';return;}
  if(prompt.trim().length<3){errorMessage='Tell us a little about your dream manicure.';promptInput?.focus();return;}
  if(!navigator.onLine){errorMessage='Connect to the internet to create your nail design.';return;}
  busy=true;stage='Creating your nail design';pollStarted=Date.now();failures=0;
  try{await readResponse(await fetch('/api/preview',{method:'POST',headers:appHeaders(),body:JSON.stringify({image:original,shape,prompt:`${prompt.trim()} Finish: ${finish}.${color?` Main polish color: ${color}.`:''}`,width,height})}));await refreshQuota();stage='Your manicure is taking shape';await poll();}
  catch(e){busy=false;errorMessage=e instanceof Error?e.message:'Your nail design could not start.';}
 }
 async function poll(){
  if(disposed)return;if(Date.now()-pollStarted>600_000){busy=false;errorMessage='Your design is taking longer than expected. Tap “Check design” to look for the result.';return;}
  try{const response=await fetch('/api/preview',{cache:'no-store',headers:appHeaders()});if(response.status>=500&&failures<3){failures++;pollTimer=setTimeout(poll,4000);return;}
   const data=await readResponse(response);failures=0;
   if(data.status==='COMPLETED'){const img=new Image();img.src=data.image;await img.decode();if(disposed)return;result=data.image;mode=original?'compare':'after';compare=50;needsPhotoChoice=true;busy=false;await refreshQuota();notify(data.galleryWarning||'Your new manicure is saved in your gallery ♡');return;}
   stage=data.status==='IN_QUEUE'?'Waiting for your turn':'Painting the little details';pollTimer=setTimeout(poll,2500);
  }catch(e){busy=false;errorMessage=e instanceof Error?e.message:'Connection interrupted. Tap “Check design” to try again.';}
 }
 async function checkPreview(){if(busy)return;busy=true;stage='Checking your design';pollStarted=Date.now();failures=0;errorMessage='';await poll();}
 async function saveImage(){if(!result||downloading)return;if(!page.data.user){window.location.assign('/login?mode=signup&next=/gallery');return;}downloading=true;try{const r=await fetch(result);if(!r.ok)throw new Error();const url=URL.createObjectURL(await r.blob());const a=document.createElement('a');a.href=url;a.download='rose-atelier-manicure.jpg';a.click();setTimeout(()=>URL.revokeObjectURL(url),10000);notify('Your manicure is ready to save.');}catch{errorMessage='Your look could not be downloaded. Please try again.';}finally{downloading=false;}}
 onMount(()=>{
  disposed=false;online=navigator.onLine;const onOnline=()=>online=true,onOffline=()=>online=false;
  window.addEventListener('online',onOnline);window.addEventListener('offline',onOffline);
  syncInstallState();const installSync=()=>{syncInstallState();void startApp();};window.addEventListener('rose-install-state',installSync);void startApp();const displayMode=matchMedia('(display-mode: standalone)');const displayChange=()=>{syncInstallState();void startApp();};displayMode.addEventListener('change',displayChange);
  const lifecycle=new AbortController(),context=document.modelContext;
  if(context?.registerTool)try{Promise.resolve(context.registerTool({name:'set_nail_design',title:'Set nail design',description:'Set the nail design prompt without generating or spending credits.',inputSchema:{type:'object',properties:{prompt:{type:'string',minLength:3,maxLength:600}},required:['prompt'],additionalProperties:false},annotations:{readOnlyHint:false},execute(input){const p=(input as {prompt?:unknown})?.prompt;if(typeof p!=='string'||p.trim().length<3||p.length>600)throw new Error('Enter a design in 3–600 characters.');if(busy)throw new Error('A design is being created.');prompt=p;selected='';return{prompt,status:'staged'};}},{signal:lifecycle.signal})).catch(()=>{});}catch{}
  return()=>{disposed=true;clearTimeout(pollTimer);clearTimeout(toastTimer);lifecycle.abort();displayMode.removeEventListener('change',displayChange);window.removeEventListener('rose-install-state',installSync);window.removeEventListener('online',onOnline);window.removeEventListener('offline',onOffline);};
 });
</script>
<svelte:head><title>{t("Rose Atelier — Your AI Nail Studio")}</title><meta name="description" content={t("Your nails, your imagination. Upload a hand photo and create your dream manicure design with AI.")}/><link rel="preconnect" href="https://fonts.googleapis.com"/><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous"/><link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Manrope:wght@400;500;600;700;800&family=Playfair+Display:ital,wght@0,500;0,600;0,700;1,500;1,600&display=swap" rel="stylesheet"/></svelte:head>
<div class="app-shell" class:has-ready={!!original&&prompt.trim().length>=3&&!needsPhotoChoice}>
 <AppHeader/>
 {#if !installed}
  <main class="access-gate" in:fly={{y:16,duration:400}}><span class="access-gate-icon"><Smartphone size={27}/></span><span class="eyebrow">{t("YOUR NAIL STUDIO, READY TO INSTALL")}</span><h1>{t("Install Rose Atelier to start designing.")}</h1><p>{t("Add the app to your home screen, then open it there to create your nail designs.")}</p><button class="primary" onclick={requestInstall}><Smartphone size={18}/>{installReady?t("Install Rose Atelier"):t("How to install Rose Atelier")}</button><small>{t("Rose Atelier installs from your browser. No app store download is needed.")}</small></main>
 {:else if !page.data.user}
  <main class="access-gate" in:fly={{y:16,duration:400}}><span class="access-gate-icon"><UserRound size={27}/></span><span class="eyebrow">{t("YOUR DESIGNS, SAVED FOR YOU")}</span><h1>{t("Create an account to design your nails.")}</h1><p>{t("Sign up or sign in in the installed app. Your free account includes 5 nail designs every day.")}</p><a class="primary" href="/login?mode=signup&next=/studio">{t("Create my free account")}<ArrowRight size={17}/></a><a class="access-gate-secondary" href="/login?next=/studio">{t("Already have an account? Sign in")}</a></main>
 {:else}
 <main>
  <div class="intro" in:fly={{y:16,duration:600}}><div><span class="eyebrow"><Sparkles size={14}/> {t("YOUR PERSONAL NAIL ATELIER")}</span><h1>{t("A little polish.")}<br class="mobile-break"/> <i>{t("A lot of you.")}</i></h1><p>{t("Try your dream manicure on your own nails.")}</p></div><div class="intro-note"><span class="note-star">✧</span><span>{t("Dream it.")}<br/>{t("Try it. Love it.")}</span><Heart size={17}/></div></div>
  {#if !online}<div class="notice" role="status">{t("You’re offline. Connect to the internet to create a design.")}</div>{/if}

  {#if quota}<div class="allowance-bar"><span><Sparkles size={14}/>{quota.tier==='guest'?t("Your first design"):quota.tier==='premium'?t("Premium atelier"):t("Free atelier")}</span><b>{quota.remaining} / {quota.limit} {t("designs left today")}</b>{#if quota.tier==='guest'}<a href="/login?mode=signup&next=/studio">{t("Create account")}</a>{:else if quota.tier==='free'}<a href="/premium">{t("Explore Premium")}</a>{/if}</div>{/if}
  {#if !appReady&&errorMessage}<div class="error-message" role="alert">{t(errorMessage)}<button onclick={startApp}>{t("Try again")}</button></div>{/if}
  <div class="how-it-works"><span>{t("YOUR LITTLE RECIPE")}</span><p><b>01</b> {t("Pick your nail shape")} <i>→</i> <b>02</b> {t("Add a photo")} <i>→</i> <b>03</b> {t("Describe your dream look")}</p></div>
  <div class="workspace">
   <section class="vibe-panel" aria-label={t("Choose nail shape and length")}><div class="step-heading"><span class="step-number">01</span><div><h2>{t("Find your perfect shape")}</h2><p>{t("Keep your natural nails, or try a new silhouette.")}</p></div><Sparkles size={19}/></div><div class="shape-grid">{#each shapes as option}<button class="shape-card" class:selected={shape===option.name} aria-pressed={shape===option.name} onclick={()=>shape=option.name} disabled={busy}><span class={`nail-silhouette ${option.kind}`}></span><span>{t(option.name)}</span>{#if shape===option.name}<Check size={14}/>{/if}</button>{/each}</div></section>
   <section class="preview-panel" aria-label={t("Nail design image")}><div class="preview-top"><div class="step-heading"><span class="step-number">02</span><div><h2>{result?t("Your new look"):t("Add your nail photo")}</h2><p>{original?t("Your nails, your canvas."):t("Or explore with our sample photo.")}</p></div></div></div>
    <div class="photo-stage" class:with-photo={!!original||!!result} class:generating={busy} ondragover={(e)=>e.preventDefault()} ondrop={(e)=>{e.preventDefault();upload(e.dataTransfer?.files[0]);}} role="region" aria-label={t("Photo canvas; drop a photo here")}>
     {#if result}<img src={result} alt={t("Your AI-generated nail design")} class="canvas-image"/>{#if mode==='compare'&&original}<div class="before-layer" style={`clip-path:inset(0 ${100-compare}% 0 0)`}><img src={original} alt={t("Your original manicure")} class="canvas-image"/></div><div class="compare-line" style={`left:${compare}%`}><span><SlidersHorizontal size={18}/></span></div><div class="image-label before-label">{t("BEFORE")}</div><div class="image-label after-label">{t("AFTER")}</div><input class="compare-range" type="range" min="0" max="100" bind:value={compare} aria-label={t("Before and after comparison")}/>{/if}
     {:else if original}<img src={original} alt={t("Your original manicure")} class="canvas-image"/>
     {:else}<img src="/manicure.jpg" alt={t("Inspiration: a glossy pale pink manicure")} class="canvas-image inspiration"/><div class="sample-tag"><Sparkles size={13}/> {t("A little nail inspiration")}</div><div class="photo-overlay"></div><div class="upload-card"><div class="upload-icon"><ImagePlus size={25} strokeWidth={1.5}/><span>+</span></div><h2>{t("Let’s start with your nails")}</h2><p>{t("A photo, a little imagination,")}<br/>{t("and your next favorite manicure.")}</p><div class="photo-buttons"><button class="primary upload-btn" onclick={()=>fileInput.click()} disabled={reading}><Upload size={17}/>{reading?t("Opening your photo…"):t("Upload your photo")}</button><button class="primary camera-btn" onclick={()=>cameraInput.click()} disabled={reading}><Camera size={17}/> {t("Take a photo")}</button></div><div class="upload-actions"><button onclick={sample}>{t("Just exploring? Try a sample")}</button></div><small>{t("JPG, PNG or WebP · up to 20 MB")}</small></div>{/if}
     {#if original&&!busy}<button class="change-photo" onclick={()=>fileInput.click()}><ImagePlus size={16}/> {t("Change photo")}</button><button class="remove-photo" onclick={clearPhoto} aria-label={t("Remove photo")}><X size={17}/></button>{/if}
     {#if reading&&original}<div class="busy-overlay"><LoaderCircle class="spin" size={24}/><p>{t("Preparing your photo…")}</p></div>{/if}
     {#if busy}<div class="busy-overlay" transition:fade><div class="magic-orbit"><Sparkles size={34} strokeWidth={1.3}/><span>✧</span></div><h2>{t("A little magic in the making")}</h2><p>{t(stage)}</p><div class="loading-track"><span></span></div><small>{t("You can switch apps and come back.")}</small></div>{/if}
    </div>
    {#if result&&needsPhotoChoice}<div class="next-photo-actions" role="group" aria-label={t("Choose how to continue")}><p>{t("Choose how to create your next look.")}</p>{#if original}<button class="secondary" onclick={reuseLastPhoto}><Sparkles size={16}/>{t("Reuse the last photo")}</button>{/if}<button class="primary" onclick={takeNewPhoto}><Camera size={16}/>{t("Take a new photo")}</button></div>{/if}
    <div class="preview-bottom">{#if result}<div class="view-toggle"><button class:active={mode==='after'} onclick={()=>mode='after'}>{t("New look")}</button><button class:active={mode==='compare'} onclick={()=>mode='compare'} disabled={!original}>{t("Before / after")}</button></div><button class="save-btn" onclick={saveImage} disabled={downloading}><Download size={16}/>{downloading?t("Saving…"):t("Save look")}</button>{:else}<span><Camera size={16}/> {t("Natural light. One hand. Nails in focus.")}</span><Heart size={17} strokeWidth={1.5}/>{/if}</div>
   </section>
   <section class="design-panel" aria-label={t("Customize your nail design")}>
    <div class="step-heading"><span class="step-number">03</span><div><h2>{t("Make it yours")}</h2><p>{t("Dream up your own, or let us inspire you.")}</p></div><WandSparkles size={19} strokeWidth={1.5}/></div>
    <div class="prompt-heading"><label class="prompt-label" for="prompt">{t("Describe your dream nails")} <span>♡</span></label><button class="inspire-btn" onclick={inspire} disabled={inspiring||busy||!online}>{#if inspiring}<LoaderCircle size={15} class="spin"/> {t("Dreaming…")}{:else}<WandSparkles size={15}/> {t("Inspire me")}{/if}</button></div>{#if suggestions.length}<div class="inspiration-list" aria-label={t("AI design suggestions")}>{#each suggestions as idea}<button class:selected={selected===idea.name} disabled={busy} onclick={()=>{prompt=idea.prompt;selected=idea.name;}}><span><b>{idea.name}</b><small>{idea.summary}</small></span><span>↗</span></button>{/each}<p>{t("Pick an idea to fill your prompt, then make it your own.")}</p></div>{/if}<div class="prompt-box"><textarea id="prompt" bind:this={promptInput} bind:value={prompt} oninput={()=>selected=''} maxlength="600" disabled={busy} placeholder={t("Think soft pink French tips, tiny cherries, a little shimmer…")} rows="3"></textarea><div class="prompt-foot"><span><Sparkles size={12}/> {t("Little details make it personal")}</span><span>{prompt.length}/600</span></div></div>
    <div class="preferences"><div><label for="finish">{t("The finish")}</label><div class="select-wrap"><select id="finish" bind:value={finish} disabled={busy}><option value="Glossy">{t("Glossy")}</option><option value="Matte">{t("Matte")}</option><option value="Pearlescent">{t("Pearlescent")}</option><option value="Chrome">{t("Chrome")}</option><option value="Glitter">{t("Glitter")}</option></select><ChevronDown size={15}/></div></div><fieldset><legend>{t("A touch of color")}</legend><div class="color-swatches">{#each colors as swatch}<button type="button" style={`--color:${swatch.value}`} class:chosen={color===swatch.value} aria-label={t(swatch.name)} aria-pressed={color===swatch.value} title={t(swatch.name)} onclick={()=>color=color===swatch.value?'':swatch.value} disabled={busy}>{#if color===swatch.value}<Check size={13}/>{/if}</button>{/each}</div></fieldset></div>
    {#if errorMessage}<div class="error-message" role="alert" transition:fade><span>{t(errorMessage)}</span><button onclick={()=>errorMessage=''} aria-label={t("Dismiss message")}><X size={16}/></button></div>{/if}
    <button class="primary generate-btn" class:mobile-ready={!!original&&prompt.trim().length>=3&&!needsPhotoChoice} onclick={generate} disabled={busy||reading||needsPhotoChoice||!online}>{#if busy}<LoaderCircle size={19} class="spin"/>{t("Creating your manicure…")}{:else}<Sparkles size={19}/>{result?(needsPhotoChoice?t("Choose how to continue"):t("Dream up another look")):t("Design my nails")}{/if}</button>
    <div class="generation-note"><span>{t("Made for your nails. Dreamed up by you.")}</span><small>{t("AI nail designs may vary from a salon result.")}</small></div>
    {#if errorMessage&&original}<button class="check-preview" onclick={checkPreview} disabled={busy}><RefreshCw size={14}/> {t("Check design")}</button>{/if}
   </section>
  </div>{#if result&&!page.data.user}<div class="guest-save-card"><Heart size={20}/><h2>{t("Keep your first little obsession.")}</h2><p>{t("Create a free account to download this look and make up to 5 designs a day.")}</p><a class="primary" href="/login?mode=signup&next=/gallery">{t("Save my look & create an account")}</a></div>{/if}<div class="studio-footer"><span><Heart size={13}/> {t("A tiny ritual. A little joy.")}</span><span>{t("Your photo is sent to our AI provider only when you create a design.")}</span></div>
 </main>
 {/if}
 <footer class="site-footer"><span>rose <i>atelier</i></span><small>{t("YOUR NEXT MANICURE, IMAGINED.")}</small><a href="https://unsplash.com/photos/vtQHwU4F13s" target="_blank" rel="noreferrer">{t("Inspiration photo by Chelson Tamares")}</a></footer>
</div>
<input class="hidden-file" type="file" accept="image/jpeg,image/png,image/webp" bind:this={fileInput} onchange={(e)=>upload(e.currentTarget.files?.[0])} aria-label={t("Upload nail photo")} tabindex="-1"/>
<input class="hidden-file" type="file" accept="image/jpeg,image/png,image/webp" capture="environment" bind:this={cameraInput} onchange={(e)=>upload(e.currentTarget.files?.[0])} aria-label={t("Take nail photo")} tabindex="-1"/>
{#if toast}<div class="toast" role="status" transition:fly={{y:20,duration:250}}><Check size={16}/>{t(toast)}</div>{/if}
