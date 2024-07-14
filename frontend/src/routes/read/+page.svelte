<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import mammoth from 'mammoth';
	import JSZip from 'jszip';

	let fileInput: HTMLInputElement;
	let fileContent = '';

	async function handleFileUpload(event: Event) {
		const file = (event.target as HTMLInputElement).files?.[0];
		if (file) {
			if (file.name.endsWith('.docx') || file.name.endsWith('.doc')) {
				await readDocFile(file);
			} else if (file.name.endsWith('.pptx')) {
				if (browser) {
					await readPptxFile(file);
				} else {
					alert('PPTX parsing is only available in the browser.');
				}
			} else {
				alert('Please upload a valid .docx, .doc, or .pptx file.');
			}
		}
	}

	async function readDocFile(file: File) {
		const arrayBuffer = await file.arrayBuffer();
		const result = await mammoth.extractRawText({ arrayBuffer });
		fileContent = result.value;
	}

	async function readPptxFile(file: File) {
		const arrayBuffer = await file.arrayBuffer();
		const zip = new JSZip();
		const zipContent = await zip.loadAsync(arrayBuffer);

		let content = '';
		let slideIndex = 1;

		for (const fileName in zipContent.files) {
			if (fileName.startsWith('ppt/slides/slide')) {
				const slide = await zipContent.file(fileName)?.async('string');
				if (slide) {
					content += `Slide ${slideIndex}:\n`;
					const textMatches = slide.match(/<a:t>(.+?)<\/a:t>/g);
					if (textMatches) {
						textMatches.forEach((match) => {
							const text = match.replace(/<a:t>|<\/a:t>/g, '');
							content += `${text}\n`;
						});
					}
					content += '\n';
					slideIndex++;
				}
			}
		}

		fileContent = content;
	}
</script>

<main>
	<h1>Document and PowerPoint File Reader</h1>
	<input type="file" accept=".docx,.doc,.pptx" on:change={handleFileUpload} bind:this={fileInput} />
	{#if fileContent}
		<h2>File Content:</h2>
		<p class="file-content">{fileContent}</p>
	{/if}
</main>

<style>
	/* ... styles remain the same ... */
</style>
