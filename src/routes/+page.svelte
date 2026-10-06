<script lang="ts">
 import {translate} from '$lib/i18n';
 import {page} from '$app/state';
 const t=(text:string)=>translate(page.data.lang,text);
 import AppHeader from '$lib/AppHeader.svelte';
 import {Sparkles,ArrowRight,Images,Heart,Camera,Check,ShieldCheck} from 'lucide-svelte';
 import {fly} from 'svelte/transition';
</script>

<svelte:head>
 <title>{t('Rose Atelier — Design your next manicure on your own nails')}</title>
 <meta name="description" content={t('Upload a photo of your hand, choose a nail shape and describe your style. See your AI nail design before your next salon visit.')} />
</svelte:head>

<div class="app-shell"><AppHeader/><main class="acquisition-main">
 <section class="acquisition-hero" in:fly={{y:18,duration:450}}>
  <div class="acquisition-copy">
   <span class="eyebrow"><Sparkles size={14}/>{t('AI NAIL DESIGN STUDIO')}</span>
   <h1>{t('Design your next manicure')}<br/><i>{t('on your own nails.')}</i></h1>
   <p>{t('Install the Rose Atelier app and create a free account to design your next manicure on your own nails.')}</p>
   <div class="acquisition-actions"><a class="primary home-create" href="/studio"><Sparkles size={19}/>{t('Get started in Rose Atelier')}<ArrowRight size={18}/></a>{#if page.data.user}<a class="home-gallery-button" href="/gallery"><Images size={17}/>{t('See my gallery')}</a>{/if}<a class="sample-link" href="/studio?sample=1">{t('Explore with a sample photo')}<ArrowRight size={15}/></a></div>
   <ul class="first-try-points"><li><Check size={15}/>{t('5 designs a day with a free account')}</li><li><Check size={15}/>{t('Install the app to create designs')}</li><li><Check size={15}/>{t('Sign in to save your gallery')}</li></ul>
  </div>
  <div class="acquisition-visual">
   <div class="inspiration-frame"><img src="/manicure.jpg" alt={t('Example manicure inspiration on real hands')}/><span class="inspiration-tag"><Sparkles size={13}/>{t('A LOOK TO INSPIRE YOURS')}</span><span class="image-caption">{t('Your photo. Your idea. Your nail design.')}</span></div>
   <div class="flow-card"><div><span>{t('01 · YOUR PHOTO')}</span><b>{t('Take or upload a hand photo')}</b></div><ArrowRight size={18}/><div><span>{t('02 · YOUR STYLE')}</span><b>{t('Choose shape and describe your look')}</b></div></div>
  </div>
 </section>

 <section class="how-section" id="how-it-works" aria-labelledby="how-title">
  <span class="eyebrow">{t('FROM IDEA TO NAIL DESIGN')}</span><h2 id="how-title">{t('See your manicure idea before the salon.')}</h2>
  <div class="how-cards"><article><span>01</span><Camera size={22}/><h3>{t('Add a hand photo')}</h3><p>{t('Take a new photo or choose one from your device. A sample is ready if you want to explore first.')}</p></article><article><span>02</span><Sparkles size={22}/><h3>{t('Make the look yours')}</h3><p>{t('Choose a nail shape, finish and color, then describe the details you have in mind.')}</p></article><article><span>03</span><Images size={22}/><h3>{t('Create and save your design')}</h3><p>{t('See your AI nail design on your photo. Keep it as inspiration for your next salon visit.')}</p></article></div>
 </section>

 <section class="privacy-promise" id="photo-privacy"><span class="privacy-icon"><ShieldCheck size={21}/></span><div><b>{t('Your photo stays yours.')}</b><p>{t('Your hand photo is sent to our AI provider only when you create a design. Sign in to the installed app whenever you are ready to create.')}</p></div><a href="/studio">{t('Get started')}<ArrowRight size={15}/></a></section>

 {#if page.data.user}
  <nav class="home-extra" aria-label={t('More from your atelier')}><a href="/polls">{t('My nail polls ↗')}</a><a href="/premium">{t('Premium plans')}</a></nav>
 {:else}
  <div class="closing-cta"><h2>{t('Ready to design your next manicure?')}</h2><a class="primary" href="/studio">{t('Install Rose Atelier and get started')}<ArrowRight size={17}/></a><small><Heart size={13}/>{t('A free account includes 5 nail designs each day.')}</small></div>
 {/if}
 <p class="home-footnote">{t('AI nail designs are creative inspiration and may differ from salon results.')}</p>
</main></div>
