<script lang="ts">
	import { onMount } from 'svelte';
	import OpenAI from 'openai';
	import { data } from '../../../lib/data';

	const openai = new OpenAI({
		apiKey: import.meta.env.VITE_OPENAI_APIKEY,
		dangerouslyAllowBrowser: true
	});
	export let file_id: string;
	let citationText: string | undefined = 'Loading ...';

	onMount(async () => {
		try {
			const data: OpenAI.Files.FileObject = await openai.files.retrieve(file_id);
			citationText = data.filename;
		} catch (err) {
			console.log('Could not load file name');
		}
	});
</script>

{citationText}
