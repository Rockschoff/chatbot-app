<!-- src/routes/+layout.svelte
<script lang="ts">
	import { onMount } from 'svelte';
	import { auth } from '../lib/firebase/firebase.client';
	import { authStore } from '../stores/authStore';
	import ToolTip from './components/ToolTip.svelte';
	import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
	import { faInfoCircle } from '@fortawesome/free-solid-svg-icons';
	import '../app.css';

	let tooltipVisible = false;

	function toggleToolTip() {
		tooltipVisible = !tooltipVisible;
	}

	onMount(() => {
		const unsubscribe = auth.onAuthStateChanged((user) => {
			authStore.update((curr) => ({ ...curr, isLoading: false, currentUser: user }));
			if (!user && window.location.pathname !== '/') {
				window.location.href = '/';
			}
		});

		return () => unsubscribe();
	});
</script>

<div class="flex items-center justify-center w-full h-16 px-4 shadow-md">
	<div class="flex items-center justify-between w-full max-w-6xl">
		<img class="h-12" src="./logo.png" alt="company logo" />
		<div class="relative" on:click={toggleToolTip}>
			<FontAwesomeIcon icon={faInfoCircle} class="text-blue-500 text-3xl cursor-pointer" />
		</div>
	</div>
</div>

{#if tooltipVisible}
	<ToolTip on:closeToolTip={() => (tooltipVisible = false)} />
{/if}

<slot /> -->
<!-- src/routes/+layout.svelte -->
<!-- src/routes/+layout.svelte -->
<script lang="ts">
	import { onMount } from 'svelte';
	import { auth } from '../lib/firebase/firebase.client';
	import { authStore } from '../stores/authStore';
	import ToolTip from './components/ToolTip.svelte';
	import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
	import { faInfoCircle } from '@fortawesome/free-solid-svg-icons';
	import '../app.css';

	let tooltipVisible = false;

	function toggleToolTip() {
		tooltipVisible = !tooltipVisible;
	}

	onMount(() => {
		const unsubscribe = auth.onAuthStateChanged((user) => {
			authStore.update((curr) => ({ ...curr, isLoading: false, currentUser: user }));
			if (!user && window.location.pathname !== '/') {
				window.location.href = '/';
			}
			console.log(user);
		});

		return () => unsubscribe();
	});
</script>

<div class="navbar border-2 border-black">
	<img class="logo" src="./logo.png" alt="company logo" />
	<h1 class="heading-font center-heading">IN-Q compliance knowledge center</h1>
	<div class="relative" on:click={toggleToolTip}>
		<FontAwesomeIcon icon={faInfoCircle} class="info-icon" style="color: black;" />
	</div>
</div>

{#if tooltipVisible}
	<ToolTip on:closeToolTip={() => (tooltipVisible = false)} />
{/if}

<slot />
