<script lang="ts">
	import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
	import { faBars, faTimes } from '@fortawesome/free-solid-svg-icons';
	import { authStore, authHandlers } from '../../../stores/authStore';
	import { createEventDispatcher, onMount } from 'svelte';
	import ThreadListElement from './ThreadListElement.svelte';

	export let threads: { thread_id: string; thread_name: string }[];
	export let user_id: string | null;
	export let user_entry: any;
	export let isGenerating:boolean;

	const dispatch = createEventDispatcher();

	let editableName: string = $authStore?.currentUser?.displayName;
	let isEditing = false;

	let lockedHistory: string[] = ['Locked ...', 'Locked ...', 'Locked ...'];
	async function logout() {
		await authHandlers.logout();
	}


	function editMode() {
		isEditing = true;
		editableName = $authStore.currentUser.displayName; // Ensure you have a reactive statement to access store
	}

	function startNewChat() {
		if(isGenerating){
			return
		}
		dispatch('newChat', { retrieval: false });
	}

	function loadMessages(thread_id: string, thread_name: string) {
		if(isGenerating){
			return
		}
		dispatch('newChat', { thread_id, user_id, thread_name, retrieval: true });
	}

	// Function to save the new name
	async function saveName() {
		isEditing = false;
		authStore.update((curr) => {
			return { ...curr, isLoading: true };
		});
		// Here you would call your API to update the user's name
		try {
			await authHandlers.updateName($authStore.currentUser, editableName); // Placeholder for your API call
		} catch (error) {
			console.error('Failed to update user name:', error);
			// Optionally reset to original or show an error message
		}

		authStore.update((curr) => {
			return { ...curr, isLoading: false };
		});
	}

	const backendUrl = import.meta.env.VITE_BACKEND_URL;

	// Function to delete a thread
	async function deleteThread(thread_id: string, thread_name: string) {
		try {
			const response = await fetch(`${backendUrl}/delete-thread`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ user_id, thread_id, thread_name })
			});

			if (!response.ok) {
				throw new Error('Failed to delete thread');
			}

			// Remove the deleted thread from the threads array
			threads = threads.filter((thread) => thread.thread_id !== thread_id);
		} catch (error) {
			console.error('Error deleting thread:', error);
		}
	}
</script>

<div class="sidebar flex flex-col h-full bg-gray-900 text-white">
	<div class="profile flex items-center space-x-4 p-6 bg-gray-800 shadow-lg">
		<div class="bg-gray-600 h-12 w-12 rounded-full"></div>
		{#if isEditing}
			<input
				class="text-lg font-semibold text-white bg-gray-800 focus:outline-none"
				type="text"
				bind:value={editableName}
				on:blur={saveName}
				on:keydown={(e) => {
					if (e.key === 'Enter') saveName();
				}}
			/>
		{:else}
			<p
				class="text-lg font-semibold text-white hover:underline cursor-pointer"
				on:dblclick={editMode}
			>
				{$authStore?.currentUser?.displayName}
			</p>
		{/if}
	</div>
	<div class="chat-history flex-grow flex flex-col w-full bg-gray-800 p-4  overflow-y-auto">
		<p class="font-bold  text-xl text-white mb-2">Chat History</p>
		{#if true}
			{#each threads.slice().reverse() as thread, index}
				<ThreadListElement thread={thread} index={index}
					on:deleteThread={(event) => { deleteThread(event.detail.thread_id, event.detail.thread_name) }}
					on:loadMessages={(event) => { loadMessages(event.detail.thread_id, event.detail.thread_name); }} />
			{/each}
		{/if}
	</div>
</div>

<style>
	.hover-underline:hover {
		text-decoration: underline; /* Adds underline on hover */
	}

	.blurred-border {
		position: relative;
		overflow: hidden; /* Ensures no overflow from the pseudo-element */
	}
	.blurred-border::before {
		content: '';
		position: absolute;
		top: -10px; /* Adjust depending on the blur amount */
		left: 0;
		right: 0;
		height: 10px; /* Height of the blur effect */
		background: inherit; /* Inherits the background of the parent */
		filter: blur(8px); /* Adjust the blur intensity as needed */
		border-radius: 10px 10px 0 0; /* Rounded top corners */
	}
	.profile {
		padding: 5px; /* Smaller padding on mobile */
	}

	.chat-history {
		padding: 2px; /* Smaller padding on mobile */
	}

	@media (min-width: 768px) {
		.profile,
		.chat-history {
			padding: 10px; /* Larger padding on desktops */
		}
	}


	input {
		max-width: 200px; /* Limit input size to avoid layout shift */
	}
</style>