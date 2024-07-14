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

	onMount(() => {
		if (!file_id) {
			citationText = 'Invalid File ID :' + file_id;
		}
		const file = data.find((d) => d.file_id === file_id);
		citationText = file?.file_name;
	});
</script>

{citationText}
