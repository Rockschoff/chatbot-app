<script lang="ts">
	import { storage, getDownloadURL, ref, listAll } from '$lib/firebase/firebase.client.js';
	import { onMount } from 'svelte';
	import PdfVeiwer from './components/PDFVeiwer.svelte';
	export let data;

	console.log(data);
	let pdfUrl: string = '';
	let fileExists: boolean = false;
	let checking: boolean = true; // To show a loading state

	onMount(async () => {
		// const res = await fetch('http://localhost:5173/api/test');
		// const ans = await res.json();
		// console.log(ans);
		// const response = await fetch(
		// 	`http://localhost:5173/api/check-file?filename=${data.file_name}`,
		// 	{
		// 		mode: 'no-cors'
		// 	}
		// );
		// const result = await response.json();
		// console.log(result);
		// fileExists = result.exists;
		// checking = false;
		// fileExists = true;
		await fetchPDF(data.file_name);
		checking = false;
	});

	// async function fetchPDF(file_name: string) {
	// 	try {
	// 		const storageRef = ref(storage, file_name);
	// 		pdfUrl = await getDownloadURL(storageRef);
	// 		fileExists = true;
	// 	} catch (err) {
	// 		console.log('Error loading pdf url');
	// 		fileExists = false;
	// 	}
	// }

	async function fetchPDF(file_name: string) {
  try {
    const storageRef = ref(storage, file_name);
    pdfUrl = await getDownloadURL(storageRef);
    fileExists = true;
  } catch (err) {
    console.log('Error loading pdf url, attempting to find similar file');
    fileExists = false;
    
    try {
      // List all files in the storage
      const listResult = await listAll(ref(storage));
      
      // Find the most similar filename
      let closestMatch = '';
      let highestSimilarity = 0;
      
      for (const item of listResult.items) {
        const similarity = calculateSimilarity(file_name, item.name);
        if (similarity > highestSimilarity) {
          highestSimilarity = similarity;
          closestMatch = item.name;
        }
      }
      
      if (closestMatch) {
        const similarStorageRef = ref(storage, closestMatch);
        pdfUrl = await getDownloadURL(similarStorageRef);
        fileExists = true;
        console.log(`Found similar file: ${closestMatch}`);
      } else {
        console.log('No similar file found');
      }
    } catch (err) {
      console.log('Error finding similar file');
    }
  }
}

// Helper function to calculate similarity between two strings
function calculateSimilarity(str1: string, str2: string): number {
  // Implement your preferred string similarity algorithm here
  // This is a simple example using Levenshtein distance
  const distance = levenshteinDistance(str1, str2);
  const maxLength = Math.max(str1.length, str2.length);
  return 1 - distance / maxLength;
}

// Levenshtein distance calculation
function levenshteinDistance(str1: string, str2: string): number {
  const m = str1.length;
  const n = str2.length;
  const dp: number[][] = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = Math.min(
          dp[i - 1][j] + 1,
          dp[i][j - 1] + 1,
          dp[i - 1][j - 1] + 1
        );
      }
    }
  }

  return dp[m][n];
}
</script>

<h1>{data.file_name}</h1>

{#if checking}
	<p>Checking file availability...</p>
{:else if fileExists}
	<a
		class="text-blue-500 hover:text-blue-700 hover:underline"
		href={pdfUrl}
		download={data.file_name}>Download</a
	>
	<PdfVeiwer {pdfUrl} />
{:else}
	<p>This document is not available at the moment.</p>
{/if}

<p>{pdfUrl}</p>

<!-- <script lang="ts">
	import { onMount } from 'svelte';
	import { storage, getDownloadURL, ref } from '../../../lib/firebase/firebase.client';
	import * as pdfjsLib from 'pdfjs-dist/build/pdf';
	import * as pdfjsViewer from 'pdfjs-dist/web/pdf_viewer';
	import 'pdfjs-dist/web/pdf_viewer.css';

	export let data: { file_name: string; file_id: string };
	let pdfUrl: string;
	let pdfContainer: HTMLDivElement;
	let file_name: string = data.file_name;
	console.log(data);

	pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.js`;

	async function fetchPDF() {
		try {
			const storageRef = ref(storage, file_name);
			pdfUrl = await getDownloadURL(storageRef);
			displayPDF(pdfUrl);
		} catch (err) {
			console.error('Error has occurred in fetching the pdf', err);
		}
	}

	async function displayPDF(url: string) {
		const loadingTask = pdfjsLib.getDocument(url);
		const pdfDocument = await loadingTask.promise;
		const pdfViewer = new pdfjsViewer.PDFViewer({
			container: pdfContainer
		});
		pdfViewer.setDocument(pdfDocument);
	}

	onMount(() => {
		if (file_name) {
			fetchPDF();
		}
	});
</script>

<svelte:head>
	<title>{file_name}</title>
</svelte:head>

<div class="pdf-viewer-container" bind:this={pdfContainer}></div>

<style>
	.pdf-viewer-container {
		width: 100%;
		height: 100vh;
		overflow: auto;
		position: relative;
	}

	/* PDF.js specific styles */
	.pdfViewer .page {
		margin: 10px auto;
		border: 1px solid #ccc;
		box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
	}
</style> -->
