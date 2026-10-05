<script lang="ts">
 import {translate} from '$lib/i18n';import {page} from '$app/state';const t=(text:string)=>translate(page.data.lang,text);
 import AppHeader from '$lib/AppHeader.svelte';import {enhance} from '$app/forms';import {UserRound,Crown,Sparkles,ArrowRight,Check} from 'lucide-svelte';import type {PageProps} from './$types';
 let {data,form}:PageProps=$props();let pending=$state(false);
</script>
<svelte:head><title>{t('Your profile')} — Rose Atelier</title><meta name="robots" content="noindex"/></svelte:head>
<div class="app-shell"><AppHeader/><main class="profile-main">
 <span class="eyebrow"><UserRound size={15}/>{t('YOUR PROFILE')}</span><h1>{data.name?`${t('Welcome back,')} ${data.name}.`:t('A little space, just for you.')}</h1>
 <section class="profile-card"><h2>{t('Your details')}</h2><p>{t('Your name will appear in your atelier.')}</p><form method="POST" use:enhance={()=>{pending=true;return async({update})=>{try{await update();}finally{pending=false;}};}}>
 <input type="hidden" name="next" value={data.next}/><label for="profile-name">{t('Your name')}</label><input id="profile-name" name="name" value={form?.name??data.name} maxlength="80" autocomplete="name" required/><small>{data.email}</small>
 {#if form?.message}<p class="profile-error" role="alert">{t(form.message)}</p>{/if}<button class="primary" disabled={pending}>{pending?t('Saving…'):t('Save my name')}<ArrowRight size={17}/></button>
 </form></section>
 <section class="profile-premium"><span class="premium-icon"><Crown size={22}/></span><span class="eyebrow">{t('MAKE EVERY PURCHASE MORE LOVELY')}</span><h2>{t('Planned Premium benefit: permanent 20% off store products when store checkout becomes available.')}</h2><p>{t('Store checkout is not available yet. Once connected, this benefit is planned to last for as long as your Premium membership is active.')}</p><ul><li><Check size={16}/>{t('Planned: 20% off all store products while subscribed')}</li><li><Check size={16}/>{t('20 nail designs every day')}</li></ul>
 {#if data.tier==='premium'}<a class="primary" href="/premium">{t('Manage my Premium')}<Sparkles size={17}/></a>{:else if data.checkoutUrl}<a class="primary" href={data.checkoutUrl}>{t('Buy Premium')}<ArrowRight size={17}/></a>{:else}<a class="primary" href="/premium">{t('Explore Premium')}<ArrowRight size={17}/></a><small class="checkout-note">{t('Premium checkout is not configured yet.')}</small>{/if}
 </section>
</main></div>
