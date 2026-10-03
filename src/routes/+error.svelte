<script lang="ts">import {page} from '$app/state';import AppHeader from '$lib/AppHeader.svelte';</script>
<svelte:head><title>A little pause — Rose Atelier</title></svelte:head>
<div class="app-shell"><AppHeader/><main class="auth-error-page"><span class="eyebrow">A LITTLE PAUSE</span><h1>Let’s get you back to lovely.</h1><p>{page.error?.message||'This page could not open. Please try again.'}</p><a class="primary" href={page.status===401?'/login':'/'}>{page.status===401?'Sign in':'Back to your atelier'}</a></main></div>
