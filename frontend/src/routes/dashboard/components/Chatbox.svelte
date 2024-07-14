<script lang="ts">
	import { onMount, createEventDispatcher } from 'svelte';
	import Message from './Message.svelte';
	import OpenAI from 'openai';
	import * as pdfjsLib from 'pdfjs-dist';
	import * as XLSX from 'xlsx';
	import Papa from 'papaparse';
	import mammoth from 'mammoth';
	import JSZip from 'jszip';

	const dispatch = createEventDispatcher();

	export let user_id: string;

	interface citation {
		file_id: string;
		text: string;
		start_index: number | null;
		end_index: number | null;
	}

	interface MessageContent {
		profilePicUrl: string;
		senderName: string;
		messageTime: string;
		messageText: string;
		citationList: citation[] | null;
	}

	let file_text: string = '';
	export let messageContentList: MessageContent[];
	let files: File[] = [];
	let messageInput = '';
	export let threadId: string | null;

	const openai = new OpenAI({
		apiKey: import.meta.env.VITE_OPENAI_APIKEY,
		dangerouslyAllowBrowser: true
	});
	async function handleEnterPress(event) {
		if (event.key === 'Enter') sendMessage();
	}

	function scrollToBottom() {
		requestAnimationFrame(() => {
			const messageContainer = document.querySelector('.message-container');
			if (messageContainer) {
				messageContainer.scrollTop = messageContainer.scrollHeight;
			}
		});
	}

	async function handleFileUpload(event) {
		const newFiles = Array.from(event.target.files);
		files = [...files, ...newFiles];
	}

	onMount(async () => {
		// const thread = await openai.beta.threads.create();
		// threadId = thread.id;
		pdfjsLib.GlobalWorkerOptions.workerSrc =
			'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.9.359/pdf.worker.min.js';
	});

	async function getFileText(file: File): Promise<string> {
		if (file.name.endsWith('.pdf')) {
			return await getPDFText(file);
		} else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
			return await getExcelText(file);
		} else if (file.name.endsWith('.csv')) {
			return await getCSVText(file);
		} else if (file.name.endsWith('.docx')) {
			return await getDocxText(file);
		} else if (file.name.endsWith('.pptx')) {
			return await getPptxText(file);
		} else {
			throw new Error('Unsupported file type');
		}
	}

	async function getPDFText(file: File): Promise<string> {
		const arrayBuffer = await file.arrayBuffer();
		const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

		let fullText = '';
		for (let i = 1; i <= pdf.numPages; i++) {
			const page = await pdf.getPage(i);
			const textContent = await page.getTextContent();
			const pageText = textContent.items.map((item: any) => item.str).join(' ');
			fullText += pageText + '\n\n';
		}

		return fullText.trim();
	}

	async function getExcelText(file: File): Promise<string> {
		const arrayBuffer = await file.arrayBuffer();
		const workbook = XLSX.read(arrayBuffer, { type: 'array' });

		let fullText = '';
		workbook.SheetNames.forEach((sheetName) => {
			const worksheet = workbook.Sheets[sheetName];
			const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
			const sheetText = data.map((row) => row.join(', ')).join('\n');
			fullText += `Sheet: ${sheetName}\n${sheetText}\n\n`;
		});

		return fullText.trim();
	}

	async function getCSVText(file: File): Promise<string> {
		return new Promise((resolve, reject) => {
			Papa.parse(file, {
				complete: (results) => {
					const text = results.data.map((row) => row.join(', ')).join('\n');
					resolve(text);
				},
				error: (error) => {
					reject(error);
				}
			});
		});
	}

	async function getDocxText(file: File): Promise<string> {
		const arrayBuffer = await file.arrayBuffer();
		const result = await mammoth.extractRawText({ arrayBuffer });
		return result.value;
	}

	async function getPptxText(file: File): Promise<string> {
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
		return content;
	}

	async function sendMessage() {
		if (files.length > 0) {
			file_text = '';
			for (let file of files) {
				try {
					file_text += (await getFileText(file)) + '\n\n';
				} catch (error) {
					console.error(`Error processing file ${file.name}:`, error);
				}
			}
			files = []; // Reset the files array after handling
		}
		if (messageInput.trim() || file_text) {
			const newMessage: MessageContent = {
				profilePicUrl: '',
				senderName: 'Me',
				messageTime: new Date().toLocaleTimeString(),
				messageText: messageInput,
				citationList: []
			};
			messageContentList = [...messageContentList, newMessage];
			dispatch('newMessage', {
				num_messages: messageContentList.length,
				user_id: user_id,
				thread_id: threadId,
				thread_name: messageContentList[0].messageText.substring(0, 10) + '...',
				message_content: newMessage
			});
			scrollToBottom();
			await sendToOpenAI(messageInput);
			dispatch('newMessage', {
				num_messages: messageContentList.length,
				user_id: user_id,
				thread_id: threadId,
				message_content: messageContentList[messageContentList.length - 1]
			});
			messageInput = ''; // Clear input after sending
		}
	}

	async function sendToOpenAI(userInput: string) {
		if (!threadId) return;

		const content = file_text
			? `Uploaded File Text: ${file_text}\n\nUser Input: ${userInput}`
			: userInput;

		console.log('content : ', content);
		await openai.beta.threads.messages.create(threadId, { role: 'user', content });

		const stream = await openai.beta.threads.runs.create(threadId, {
			assistant_id: import.meta.env.VITE_ASSISTANTID, // vs_D1fKWaJJGI6QKCJRVIx5ekZE
			stream: true
		});

		let botMessage: MessageContent = {
			profilePicUrl: './small_logo.png',
			senderName: 'In-Q Center',
			messageTime: new Date().toLocaleTimeString(),
			messageText: '',
			citationList: []
		};
		messageContentList = [...messageContentList, botMessage];

		for await (const event of stream) {
			if (event.event === 'thread.message.delta') {
				// const lastMessage = messageContentList[messageContentList.length - 1];
				messageContentList[messageContentList.length - 1].messageText +=
					event.data.delta.content[0].text.value;
				if (event.data.delta.content[0].text.annotations?.length > 0) {
					event.data.delta.content[0].text.annotations.forEach((ele) => {
						if (ele?.file_citation) {
							const ref: citation = {
								file_id: ele.file_citation.file_id,
								text: ele.text,
								start_index: ele.start_index,
								end_index: ele.end_index
							};
							messageContentList[messageContentList.length - 1].citationList?.push(ref);
						}
					});
				}
				scrollToBottom();
			}
		}
	}

	function removeFile(index: number) {
		files = files.filter((_, i) => i !== index);
	}
</script>

<div class="flex flex-col h-full w-full justify-between p-4">
	<div class="message-container space-y-4 relative w-full h-full">
		{#each messageContentList as message}
			<Message {...message} />
		{/each}
	</div>

	<div class="input-area bg-gray-200 w-full">
		<div class="flex flex-row justify-center items-center space-x-2 px-4 py-2">
			<input
				placeholder="Type your message here"
				class="form-input flex-grow py-2 px-4 rounded-lg"
				bind:value={messageInput}
				on:keypress={handleEnterPress}
			/>
			{#if files.length > 0}
				<div class="file-info bg-gray-100 p-2 rounded-lg h-10 overflow-y-auto">
					{#each files as file, index}
						<div class="flex items-center justify-between">
							<span>{file.name}</span>
							<button on:click={() => removeFile(index)} class="text-red-500 ml-2">×</button>
						</div>
					{/each}
				</div>
			{/if}
			<label
				for="file-upload"
				class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg cursor-pointer"
			>
				Upload
			</label>
			<input id="file-upload" type="file" multiple class="hidden" on:change={handleFileUpload} />
			<button
				class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg"
				on:click={sendMessage}
			>
				Send
			</button>
		</div>
		<p class="text-xs text-gray-600 text-center mt-2 mb-4">
			This tool is not a replacement for a human expert opinion. Please follow your company's
			internal governance process to make final decisions on actions.
		</p>
	</div>
</div>

<style>
	.message-container {
		position: relative;
		z-index: 2;
		flex-grow: 1;
		overflow-y: auto;
	}

	.message-container::before {
		content: '';
		position: fixed;
		top: 50%;
		left: 50%;
		width: 50%;
		height: 50%;
		transform: translate(-50%, -50%);
		background-image: url('./logo.png');
		background-position: center;
		background-repeat: no-repeat;
		background-size: contain;
		opacity: 0.2;
		pointer-events: none;
		z-index: 1;
	}

	.message-container > * {
		position: relative;
		z-index: 2;
	}

	@media (max-width: 768px) {
		.input-area {
			position: fixed;
			bottom: 0;
			left: 0;
			width: 100%;
			z-index: 3;
			padding: 10px;
			box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
		}

		.scroller-div {
			height: 150px;
		}
	}

	.file-info {
		max-height: 2.5rem;
		overflow-y: auto;
	}
</style>
