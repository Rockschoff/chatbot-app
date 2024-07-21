<script lang="ts">
	import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
	import { faBars, faTimes } from '@fortawesome/free-solid-svg-icons';
	import { authStore, authHandlers } from '../../../stores/authStore';
	import { createEventDispatcher, onMount } from 'svelte';

	export let threads: { thread_id: string; thread_name: string }[];
	export let user_id: string | null;
	export let user_entry: any;

	const dispatch = createEventDispatcher();

	let editableName: string = $authStore?.currentUser?.displayName;
	let isEditing = false;

	let lockedHistory: string[] = ['Locked ...', 'Locked ...', 'Locked ...'];
	async function logout() {
		await authHandlers.logout();
	}

	let showSidebar = true; // Controls the visibility of the sidebar

	function toggleSidebar() {
		showSidebar = !showSidebar;
	}

	function editMode() {
		isEditing = true;
		editableName = $authStore.currentUser.displayName; // Ensure you have a reactive statement to access store
	}

	function startNewChat() {
		dispatch('newChat', { retrieval: false });
	}

	function loadMessages(thread_id: string, thread_name: string) {
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

<div class="sidebar flex flex-col h-full" class:hide={!showSidebar}>
	<div class="profile flex items-center space-x-4 p-10 bg-gray-200 shadow-lg blurred-border">
		<div class="bg-gray-400 h-12 w-12 rounded-full"></div>
		{#if isEditing}
			<input
				class="text-lg font-semibold text-gray-700"
				type="text"
				bind:value={editableName}
				on:blur={saveName}
				on:keydown={(e) => {
					if (e.key === 'Enter') saveName();
				}}
			/>
		{:else}
			<p
				class="text-lg font-semibold text-gray-700 hover:underline cursor-pointer"
				on:dblclick={editMode}
			>
				{$authStore?.currentUser?.displayName}
			</p>
		{/if}
	</div>
	<div class="chat-history flex-grow flex flex-col w-full bg-gray-100 p-5 overflow-y-auto">
		<p class="font-bold hover-underline text-xl text-gray-800 mb-2">Chat History</p>
		<span class="text-xs text-gray-600 mb-4">feature available in Basic +</span>
		{#if true}
			{#each threads.slice().reverse() as thread, index}
				<div
					class="w-full flex items-center p-2 pl-5 bg-white mb-2 rounded-md shadow hover:bg-gray-200 cursor-pointer transition duration-200"
				>
					<p
						class="text-gray-600 hover-underline flex-grow"
						on:click={() => {
							loadMessages(thread.thread_id, thread.thread_name);
						}}
					>
						{index + 1}. {thread.thread_name}
					</p>
					<button
						class="text-red-600 hover:text-red-800 transition duration-200"
						on:click={() => deleteThread(thread.thread_id, thread.thread_name)}
					>
						<FontAwesomeIcon icon={faTimes} />
					</button>
				</div>
			{/each}
		{:else}
			{#each lockedHistory as thread, index}
				<div
					class="w-full flex items-center p-2 pl-5 bg-white mb-2 rounded-md shadow hover:bg-gray-200 cursor-pointer transition duration-200"
				>
					<p class="text-gray-600 hover-underline flex-grow">
						{index + 1}. {thread}
					</p>
					<!-- <button
						class="text-red-600 hover:text-red-800 transition duration-200"
						on:click={() => deleteThread(thread.thread_id, thread.thread_name)}
					>
						<FontAwesomeIcon icon={faTimes} />
					</button> -->
				</div>
			{/each}
		{/if}
	</div>
	<button
		class="w-full p-2 bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 rounded-md transition duration-200 ease-in-out text-center mb-4"
		on:click={startNewChat}
	>
		New Chat
	</button>
	<button
		class="w-full p-2 bg-gray-200 hover:bg-red-200 hover:text-red-400 text-gray-400 text-white font-bold py-2 rounded-md transition duration-200 ease-in-out text-center mt-auto mb-4"
		on:click={logout}
	>
		Log Out
	</button>
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

	.hide {
		transform: translateX(-100%);
		transition: transform 0.3s ease-in-out;
		display: none;
	}

	input {
		max-width: 200px; /* Limit input size to avoid layout shift */
	}
</style>
