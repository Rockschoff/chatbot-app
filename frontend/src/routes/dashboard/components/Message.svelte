<script lang="ts">
	// import data from '../../../lib/data';

	import { onMount } from 'svelte';
	import { marked } from 'marked';
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

	export let profilePicUrl;
	export let senderName;
	export let messageTime;
	export let messageText;
	export let citationList : citation[];
	export let attachments;
	export let userId;

	// async function getFile(file_id: string) {
	// 	if (!file_id) {
	// 		console.log('file not found');
	// 	}
	// 	console.log('calling the api');
	// 	const file = await openai.files.retrieve(file_id);
	// 	console.log('got the results');
	// 	console.log(file);
	// }

	marked.setOptions({
        breaks: true,
        gfm: true,
      // Allow raw HTML to be included in the output
    });
	// Reactive statement to handle no profile picture
	$: imageUrl = profilePicUrl || 'default-image'; // Use 'default-image' or leave blank
	$: hasImage = Boolean(profilePicUrl);

	// Convert Markdown to HTML
	$: htmlMessage = marked(messageText || '');

	// Function to modify all links to open in a new tab
	function setLinksToOpenInNewTab() {
		const links = document.querySelectorAll('.markdown-content a');
		links.forEach(link => {
			link.setAttribute('target', '_blank');
			link.setAttribute('rel', 'noopener noreferrer'); // Security best practice
		});
	}

	// Apply the function on component mount and whenever htmlMessage changes
	onMount(() => {
		setLinksToOpenInNewTab();
	});

	$: {
		setLinksToOpenInNewTab();
	}
</script>

<div
	class="message-box flex items-start space-x-4 p-4 bg-white shadow-lg rounded-lg w-4/5 max-w-full"
	style="opacity : 1;"
>
	{#if hasImage}
		<div class="flex-shrink-0">
			<img src={imageUrl} alt="Profile picture" class="w-10 h-10 rounded-full" />
		</div>
	{:else}
		<div class="w-10 h-10 rounded-full bg-gray-300 flex-shrink-0"></div>
	{/if}
	<div class="flex flex-col space-y-1 flex-grow min-w-0">
		<div class="flex items-baseline space-x-2">
			<h4 class="font-semibold">{senderName}</h4>
			<span class="text-xs text-gray-500">{messageTime}</span>
		</div>
		<div class="markdown-content message-font break-words overflow-hidden message-content">
			{@html htmlMessage}
		</div>
		{#if citationList.length > 0}
			<div class="flex-col citation-section mt-2 pt-2 border-t border-gray-300">
				<h5 class="text-xs font-semibold text-gray-700">Citations:</h5>
				{#each citationList as citation, index}
					<p class="citation text-xs my-1">
						
							{index + 1}.) <CitationText file_name={citation.file_name} chunk_content={citation.chunk_content} page_number={citation.page_number} />
					</p>
				{/each}
			</div>
		{/if}
	</div>
</div>

<style>
	.markdown-content :global(h3) {
		@apply text-2xl font-bold my-4;
	}
	.markdown-content :global(h4) {
		@apply text-xl font-semibold my-2;
	}
	.markdown-content :global(p) {
		@apply mb-4 leading-relaxed;
	}
	.markdown-content :global(ul) {
		@apply list-disc pl-6 mb-4;
	}
	.markdown-content :global(ol) {
		@apply list-decimal pl-6 mb-4;
	}
	.markdown-content :global(li) {
		@apply mb-2;
	}
	.markdown-content :global(strong) {
		@apply font-semibold;
	}
	.markdown-content :global(a) {
		@apply text-blue-500 hover:text-blue-700 hover:underline;
	}
</style>
