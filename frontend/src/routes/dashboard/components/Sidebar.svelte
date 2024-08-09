<script lang="ts">
    import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
    import { faBars, faTimes } from '@fortawesome/free-solid-svg-icons';
    import { authStore, authHandlers } from '../../../stores/authStore';
    import { createEventDispatcher, onMount } from 'svelte';

    export let threads: { threadId: string; threadName: string }[];
    export let user_id: string | null;
    export let user_entry: any;

    const dispatch = createEventDispatcher();

    let editableName: string = $authStore?.currentUser?.displayName;
    let isEditing = false;

    let lockedHistory: string[] = ['Locked ...', 'Locked ...', 'Locked ...'];
    

    let showSidebar = true; // Controls the visibility of the sidebar

    function toggleSidebar() {
        showSidebar = !showSidebar;
    }

    function editMode() {
        isEditing = true;
        editableName = $authStore.currentUser.displayName; // Ensure you have a reactive statement to access store
    }

    // function startNewChat() {
    //     dispatch('newChat', { retrieval: false });
    // }

    function loadMessages(threadId: string, threadName: string) {
        dispatch('newChat', { threadId, user_id, threadName, retrieval: true });
    }

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

    async function deleteThread(threadId: string, threadName: string) {
        try {
            const response = await fetch(`${backendUrl}/delete-thread`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ user_id: user_id, thread_id: threadId, threadName })
            });

            if (!response.ok) {
                throw new Error('Failed to delete thread');
            }

            threads = threads.filter((thread) => thread.threadId !== threadId);
        } catch (error) {
            console.error('Error deleting thread:', error);
        }
    }
</script>

<div class="sidebar flex flex-col h-full bg-white text-black  border-r-black border-r-2" class:hide={!showSidebar}>
    <div class="profile flex items-center space-x-4 p-6 bg-white shadow-lg">
        <div class="bg-black h-12 w-12 rounded-full"></div>
        {#if isEditing}
            <input
                class="text-lg font-semibold text-black bg-gray-800 focus:outline-none"
                type="text"
                bind:value={editableName}
                on:blur={saveName}
                on:keydown={(e) => {
                    if (e.key === 'Enter') saveName();
                }}
            />
        {:else}
            <p
                class="text-lg font-semibold text-black hover:underline cursor-pointer"
                on:dblclick={editMode}
            >
                {$authStore?.currentUser?.displayName}
            </p>
        {/if}
    </div>
    <div class="chat-history flex-grow flex flex-col w-full bg-white  p-4 overflow-y-auto">
        <p class="font-bold text-xl text-black mb-2">Chat History</p>
        <span class="text-sm text-gray-400 mb-4">feature available in Basic +</span>
        {#if true}
            {#each threads.slice().reverse() as thread, index}
                <div
                    class="w-full flex items-center p-3 bg-white mb-2 cursor-pointer transition duration-200 border-b-0 border-b-black hover:border-b-2"
                >
                    <p
                        class="text-gray-300 flex-grow hover:text-black"
                        on:click={() => {
                            loadMessages(thread.threadId, thread.threadName);
                        }}
                    >
                        {index + 1}. {thread.threadName}
                    </p>
                    <button
                        class="text-gray-200 hover:text-gray-600 transition duration-200"
                        on:click={() => deleteThread(thread.threadId, thread.threadName)}
                    >
                        <FontAwesomeIcon icon={faTimes} />
                    </button>
                </div>
            {/each}
        {:else}
            {#each lockedHistory as thread, index}
                <div
                    class="w-full flex items-center p-3 bg-gray-700 mb-2 rounded-md shadow hover:bg-gray-600 cursor-pointer transition duration-200"
                >
                    <p class="text-gray-300 hover:underline flex-grow">
                        {index + 1}. {thread}
                    </p>
                </div>
            {/each}
        {/if}
    </div>
    <!-- <button
        class="w-full p-4 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-md transition duration-200 ease-in-out text-center mb-4"
        on:click={startNewChat}
    >
        New Chat
    </button> -->
</div>

<style>
    .hover-underline:hover {
        text-decoration: underline; /* Adds underline on hover */
    }

    .profile,
    .chat-history {
        padding: 10px; /* Consistent padding on all screens */
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