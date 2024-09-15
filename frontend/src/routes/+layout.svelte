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
	import { page } from '$app/stores'; // Import the $page store
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

		// Create the small element that will follow the cursor
		const cursorInfo = document.createElement('div');
    cursorInfo.style.position = 'absolute';
    cursorInfo.style.padding = '2px 5px';
    cursorInfo.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    cursorInfo.style.color = '#fff';
    cursorInfo.style.borderRadius = '3px';
    cursorInfo.style.fontSize = '12px';
    cursorInfo.style.pointerEvents = 'none';
    cursorInfo.style.zIndex = '1000';
    cursorInfo.style.display = 'none'; // Initially hidden
    document.body.appendChild(cursorInfo);

    // Function to update the position and content of the cursorInfo element
    const updateCursorInfo = (event) => {
        const element = event.target;
        if (element.id) {
            cursorInfo.textContent = `${element.id}`;
            cursorInfo.style.display = 'block';
            cursorInfo.style.left = `${event.pageX + 10}px`;
            cursorInfo.style.top = `${event.pageY + 10}px`;
        } else {
            cursorInfo.style.display = 'none';
        }
    };

    // Attach the mousemove event listener to update the cursorInfo element
    document.addEventListener('mousemove', updateCursorInfo);

    // Cleanup function to remove the event listener and the cursorInfo element
    return () => {
        unsubscribe();
        document.removeEventListener('mousemove', updateCursorInfo);
        document.body.removeChild(cursorInfo);
    };
	});
</script>

{#if $page.url.pathname !== '/'} <!-- Check if the current path is not root -->
  <div class="navbar flex flex-col sm:flex-row items-center justify-between p-4">
    <img class="logo w-30 h-auto mb-2 sm:mb-0" src="./logo.png" alt="company logo" />
    <h1 class="heading-font text-center text-xl sm:text-2xl md:text-3xl font-bold max-w-full">IN-Q knowledge center</h1>
    <div id = "Read Introduction" class="relative mt-2 sm:mt-0" on:click={toggleToolTip} title="Introduction">
      <!-- <FontAwesomeIcon icon={faInfoCircle} class="info-icon text-2xl" /> -->
    </div>
  </div>
  {#if tooltipVisible}
    <ToolTip on:closeToolTip={() => (tooltipVisible = false)} />
  {/if}
{/if}
<slot />
