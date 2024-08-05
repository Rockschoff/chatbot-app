<script lang="ts">
	import { onMount } from 'svelte';
	import OpenAI from 'openai';
	import { writable } from 'svelte/store';

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
		console.log(file_name)
    if (file_name.substring(0,5)==("https")) {
		console.log("to the net")
        window.open(file_name, '_blank');
    } else {
		console.log("to the file")
        window.open(`${window.location.pathname}/${file_name}`, '_blank');
    }
}

</script>

<style>
	/* Add Tailwind CSS classes directly, no additional custom styles needed */
</style>

{#if $showModal}
	<div class="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50" on:click={closeModal}>
		<div class="bg-white rounded-lg shadow-lg w-full max-w-lg mx-4 p-6 relative z-10" on:click|stopPropagation>
			<div class="flex justify-between items-center border-b pb-4 mb-4">
				<h2 class="text-xl font-semibold">{file_name}</h2>
				<span class="cursor-pointer text-gray-600 hover:text-gray-800" on:click={closeModal}>&times;</span>
			</div>
			<div class="mb-4">
				<p class="font-semibold">Page Number: {page_number}</p>
				<blockquote class="pl-4 border-l-4 border-gray-300 italic text-gray-700">{chunk_content}</blockquote>
			</div>
			<div class="flex justify-between">
				<button class="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600" on:click={visitFile}>Visit Entire File</button>
				<button class="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600" on:click={closeModal}>Close</button>
			</div>
		</div>
	</div>
{/if}

<a href="javascript:void(0)" class="text-blue-500 hover:text-blue-700" on:click={openModal}>{file_name}</a>
