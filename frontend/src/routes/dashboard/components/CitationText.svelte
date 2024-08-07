<script lang="ts">
    import { onMount } from 'svelte';
    import OpenAI from 'openai';
    import { writable } from 'svelte/store';
    import { fade, fly } from 'svelte/transition';

    const openai = new OpenAI({
        apiKey: import.meta.env.VITE_OPENAI_APIKEY,
        dangerouslyAllowBrowser: true
    });

    export let file_name: string;
    export let page_number: number;
    export let chunk_content: string;

    const showModal = writable(false);

    function openModal() {
        showModal.set(true);
    }

    function closeModal() {
        showModal.set(false);
    }

    function visitFile() {
        if (file_name.substring(0,5) === "https") {
            window.open(file_name, '_blank');
        } else {
            window.open(`${window.location.pathname}/${file_name}`, '_blank');
        }
    }
</script>

{#if $showModal}
    <div class="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50" 
         on:click={closeModal}
         transition:fade={{ duration: 200 }}>
        <div class="bg-white rounded-lg shadow-2xl w-full max-w-2xl mx-4 overflow-hidden" 
             on:click|stopPropagation
             transition:fly="{{ y: 50, duration: 300 }}">
            <div class="flex justify-between items-center bg-gray-50 px-6 py-4">
                <h2 class="text-lg font-medium text-gray-800">{file_name}</h2>
                <button class="text-gray-500 hover:text-gray-700 transition-colors" on:click={closeModal}>
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                </button>
            </div>
            <div class="px-6 py-4">
                <p class="text-sm text-gray-600 mb-2">Page Number: {page_number}</p>
                <blockquote class="pl-4 border-l-4 border-blue-500 italic text-gray-700 bg-blue-50 p-3 rounded">
                    {chunk_content} ....
                </blockquote>
            </div>
            <div class="flex justify-end space-x-2 px-6 py-4 bg-gray-50">
                <button class="px-4 py-2 bg-white text-blue-600 rounded-md border border-blue-600 hover:bg-blue-50 transition-colors duration-200" 
                        on:click={closeModal}>
                    Close
                </button>
                <button class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-200" 
                        on:click={visitFile}>
                    Visit Entire File
                </button>
            </div>
        </div>
    </div>
{/if}

<button class="text-blue-600 hover:text-blue-800 transition-colors duration-200 focus:outline-none" on:click={openModal}>
    {file_name}
</button>