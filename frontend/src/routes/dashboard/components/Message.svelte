<script lang="ts">
	// import data from '../../../lib/data';

	import { afterUpdate, onMount } from 'svelte';
	import { marked } from 'marked';
	import { fade } from 'svelte/transition';
	import CitationText from './CitationText.svelte';

	interface citation {
		file_name:string;
		chunk_content:string;
		page_number:number;
	}

	import OpenAI from 'openai';

	const openai = new OpenAI({
		apiKey: import.meta.env.VITE_OPENAI_APIKEY,
		dangerouslyAllowBrowser: true
	});

	export let profilePicUrl : string;
	export let senderName : string;
	export let messageTime : string;
	export let messageText : string;
	export let citationList : citation[];
	export let attachments : File[]|string[];
	export let userId : string;

	// async function getFile(file_id: string) {
	// 	if (!file_id) {
	// 		console.log('file not found');
	// 	}
	// 	console.log('calling the api');
	// 	const file = await openai.files.retrieve(file_id);
	// 	console.log('got the results');
	// 	console.log(file);
	// }
	let liked = false;
    let copied = false;


	marked.setOptions({
        breaks: true,
        gfm: true,
      // Allow raw HTML to be included in the output
    });
	// Reactive statement to handle no profile picture
	$: imageUrl = profilePicUrl || ''; // Use 'default-image' or leave blank
	$: hasImage = Boolean(profilePicUrl);
	$: isINQCenter = senderName === "IN-Q Center";

	// Convert Markdown to HTML
	$: htmlMessage =marked(messageText || '');

	// Function to modify all links to open in a new tab
	function setLinksToOpenInNewTab() {
    const links = document.querySelectorAll('#message-content a');
    links.forEach(link => {
        link.setAttribute('target', '_blank');
        link.setAttribute('rel', 'noopener noreferrer'); // Security best practice

        if (link.href.startsWith('https://')) {
            console.log('This link is secure:', link.href);
        } else {
            console.log('This link is not secure:', link.href);
            link.textContent = link.textContent.replace(/%20/g, ' ');
        }
    });

	
}
function likeMessage() {
        liked = !liked;
        // Here you would typically send this information to your backend
    }
	async function copyToClipboard() {
        try {
            await navigator.clipboard.writeText(messageText);
            copied = true;
            setTimeout(() => copied = false, 2000);
        } catch (err) {
            console.error('Failed to copy text: ', err);
        }
    }

	// Apply the function on component mount and whenever htmlMessage changes
	onMount(() => {
		setLinksToOpenInNewTab();
	});

	afterUpdate(()=>{
		setLinksToOpenInNewTab();
	})
</script>

<div class="message-box bg-white rounded-lg shadow-sm p-4 mb-4 transition-all duration-300 hover:shadow-md"
     in:fade="{{ duration: 300 }}">
    <div class="flex items-start space-x-3">
        {#if hasImage}
            <div class="flex-shrink-0">
                <img src={imageUrl} alt="Profile picture" class="w-10 h-10 rounded-full object-cover" />
            </div>
        {:else}
            <div class="w-10 h-10 rounded-full bg-gray-300 flex-shrink-0 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
            </div>
        {/if}
        
        <div class="flex-grow min-w-0">
            <div class="flex items-center justify-between mb-2">
                <div>
                    <h4 class="font-medium text-gray-900">{senderName}</h4>
                    <span class="text-xs text-gray-500">{messageTime}</span>
                </div>
                <div class="flex space-x-2">
                    <button on:click={likeMessage} 
                            class="text-gray-400 hover:text-blue-500 transition-colors duration-200">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" 
                                class:fill-current={liked} class:text-blue-500={liked} />
                        </svg>
                    </button>
                    <button on:click={copyToClipboard} 
                            class="text-gray-400 hover:text-green-500 transition-colors duration-200">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M8 2a1 1 0 000 2h2a1 1 0 100-2H8z" />
                            <path d="M3 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v6h-4.586l1.293-1.293a1 1 0 00-1.414-1.414l-3 3a1 1 0 000 1.414l3 3a1 1 0 001.414-1.414L10.414 13H15v3a2 2 0 01-2 2H5a2 2 0 01-2-2V5zM15 11h2a1 1 0 110 2h-2v-2z" />
                        </svg>
                    </button>
                </div>
            </div>
            
            <div id="message-content" class="prose prose-sm max-w-none text-gray-700">
                {@html htmlMessage}
            </div>

            {#if citationList.length > 0}
                <div class="mt-3 pt-3 border-t border-gray-200">
                    <h5 class="text-xs font-semibold text-gray-600 mb-2">Citations:</h5>
                    {#each citationList as citation, index}
                        <p class="text-xs text-gray-600 mb-1">
                            {index + 1}.) <CitationText {...citation} />
                        </p>
                    {/each}
                </div>
            {/if}
        </div>
    </div>
</div>


{#if copied}
    <div class="fixed bottom-4 right-4 bg-green-500 text-white px-4 py-2 rounded-full shadow-lg" 
         transition:fade="{{ duration: 300 }}">
        Copied to clipboard!
    </div>
{/if}

<style>
    /* You can keep your existing styles or modify them as needed */
    .prose :global(h3) { @apply text-lg font-semibold my-3; }
    .prose :global(h4) { @apply text-base font-medium my-2; }
    .prose :global(p) { @apply mb-3 leading-relaxed; }
    .prose :global(ul) { @apply list-disc pl-5 mb-3; }
    .prose :global(ol) { @apply list-decimal pl-5 mb-3; }
    .prose :global(li) { @apply mb-1; }
    .prose :global(a) { @apply text-blue-600 hover:underline; }
</style>