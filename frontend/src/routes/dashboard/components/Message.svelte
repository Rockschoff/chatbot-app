<script lang="ts">
	// import data from '../../../lib/data';
	interface citation {
		file_id: string;
		text: string;
		start_index: number | null;
		end_index: number | null;
	}
	import { onMount } from 'svelte';
	import { marked } from 'marked';
	import CitationText from './CitationText.svelte';

	import OpenAI from 'openai';

	const openai = new OpenAI({
		apiKey: import.meta.env.VITE_OPENAI_APIKEY,
		dangerouslyAllowBrowser: true
	});

	export let profilePicUrl;
	export let senderName;
	export let messageTime;
	export let messageText;
	export let citationList: citation[] = [];

	async function getFile(file_id: string) {
		if (!file_id) {
			console.log('file not found');
		}
		console.log('calling the api');
		const file = await openai.files.retrieve(file_id);
		console.log('got the results');
		console.log(file);
	}

	marked.setOptions({
		breaks: true
	});
	// Reactive statement to handle no profile picture
	$: imageUrl = profilePicUrl || 'default-image'; // Use 'default-image' or leave blank
	$: hasImage = Boolean(profilePicUrl);

	// Convert Markdown to HTML
	$: htmlMessage = marked(messageText || '');
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
						<a
							href={'/dashboard/' + citation.file_id}
							target="_blank"
							class="text-blue-500 hover:text-blue-700 hover:underline"
							on:click={() => {
								console.log('clicked');
								getFile(citation.file_id);
							}}
						>
							{index + 1}.) <CitationText file_id={citation.file_id} /> {citation.text}</a
						>
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
