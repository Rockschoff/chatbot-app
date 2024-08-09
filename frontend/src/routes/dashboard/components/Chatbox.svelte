<script lang="ts">
	import { onMount, createEventDispatcher } from 'svelte';
	import Message from './Message.svelte';
	import { slide } from 'svelte/transition';

	let showFileUpload = false;

	function toggleFileUpload() {
	showFileUpload = !showFileUpload;
}

	let isActive=false;

	function getCurrentDateTime() {
		const now = new Date();
		const date = now.toLocaleDateString('en-US');
		const time = now.toLocaleTimeString('en-US');
		return `${date} ${time}`;
	}


	const dispatch = createEventDispatcher();

	export let user_id: string;

	interface citation {
		file_name:string;
		chunk_content:string;
		page_number:number;
	}

	interface MessageContent {
		profilePicUrl: string;
		senderName: string;
		userId: string;
		messageTime: string;
		messageText: string;
		attachments: File[] | string[];
		citationList: citation[];
	}

	let file_text: string = '';
	export let messageContentList: MessageContent[];
	let files: File[] = [];
	let messageInput = '';
	let modelOptions : number[] = [9]
	let selectedModelVersion = `v${modelOptions[0]}`; // Default to v1
	export let threadId: string;

	async function handleEnterPress(event: KeyboardEvent) {
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

	async function handleFileUpload(event: Event) {
		const input = event.target as HTMLInputElement;
		if (!input.files) return;

		const newFiles = Array.from(input.files) as File[];
		files = [...files, ...newFiles];
	}

	onMount(() => {
		scrollToBottom();
		document.addEventListener('click', handleClickOutside);
	});

	async function sendMessage() {
	if (messageInput.trim() === '') return;

	const formData = new FormData();
	files.forEach((file) => formData.append('attachments', file));

	// Create a new message object
	const newMessage: MessageContent = {
		profilePicUrl: '', // Replace with actual path
		senderName: 'User', // Replace with actual name
		userId: user_id,
		messageTime: new Date().toISOString(),
		messageText: messageInput,
		attachments: files,
		citationList: [] // Add citation logic if needed
	};

	formData.append('messageContent', JSON.stringify(newMessage));
	formData.append('threadId', threadId);
	formData.append(
		'threadName',
		messageContentList.length
			? messageContentList[0].messageText.substring(0, 25) + "..." 
			: newMessage.messageText.substring(0, 25) + "... " 
	);
	formData.append('modelVersion', selectedModelVersion);

	// Update the message list with the user's message
	messageContentList = [...messageContentList, newMessage];

	dispatch('newMessage', { numMessages: messageContentList.length });
	scrollToBottom();

	// Add a temporary loading message
	const loadingMessage: MessageContent = {
		profilePicUrl: "./small_logo.png", // Replace with actual path or a loading spinner
		senderName: 'System', // Or any indicator for the system message
		userId: 'system',
		messageTime: new Date().toISOString(),
		messageText: 'Getting Response...',
		attachments: [],
		citationList: []
	};
	messageContentList = [...messageContentList, loadingMessage];
	
	scrollToBottom();

	// Send the message to the backend
	try {
		const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/get-response`, {
			method: 'POST',
			body: formData
		});

		if (!response.ok) {
			throw new Error('Network response was not ok');
		}

		const responseData = await response.json();
		const backendMessage: MessageContent = responseData.messageContent;
		backendMessage.profilePicUrl = "./small_logo.png";

		// Remove the temporary loading message
		messageContentList = messageContentList.filter(msg => msg !== loadingMessage);

		// Update the message list with the backend's response
		messageContentList = [...messageContentList, backendMessage];
		dispatch('newMessage', { numMessages: messageContentList.length });
		scrollToBottom();
	} catch (error) {
		console.error('Failed to send message:', error);

		// Remove the temporary loading message
		messageContentList = messageContentList.filter(msg => msg !== loadingMessage);

		// Optionally, add an error message
		const errorMessage: MessageContent = {
			profilePicUrl: '', // Replace with actual path or a warning icon
			senderName: 'System',
			userId: 'system',
			messageTime: new Date().toISOString(),
			messageText: 'Failed to send message.',
			attachments: [],
			citationList: []
		};
		messageContentList = [...messageContentList, errorMessage];
		dispatch('newMessage', { numMessages: messageContentList.length });
		scrollToBottom();
	} finally {
		// Clear the input and file list
		messageInput = '';
		files = [];
	}
}

	function removeFile(index: number) {
		files = files.filter((_, i) => i !== index);
	}

	function toggleIsActive(){
		isActive = true
	}

	function handleClickOutside(event:any) {
    if (!event.target.closest('#input-area')) {
      isActive = false;
    }
  }

</script>

<div class="flex flex-col h-full w-full justify-between p-4">
	<div class="message-container p-3 space-y-4 relative w-full h-full">
		{#each messageContentList as message}
			<Message {...message} />
		{/each}
	</div>

	<div id="input-area" class="input-area transiton duration-300  border-black bg-transparent {isActive ? "border-4" :"border-2"} w-full rounded-lg " on:click={toggleIsActive}>
		<div class="flex flex-row items-center space-x-2 p-2">
		  <div class="relative flex-grow">
			<input
			  placeholder="Type your message here"
			  class="form-input w-full py-2 px-4 pr-24 rounded-lg border-none focus:outline-none  bg-transparent"
			  bind:value={messageInput}
			  on:keypress={handleEnterPress}
			/>
			<div class="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center space-x-2">
			  <button class="text-gray-500 hover:text-blue-500 focus:outline-none" on:click={toggleFileUpload}>
				{#if showFileUpload}
						<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
						</svg>
					{:else}
							<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
							</svg>
				{/if}
			  </button>
			  <select
				bind:value={selectedModelVersion}
				class="bg-transparent text-gray-700 py-1 px-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
			  >
				{#each modelOptions as option, i}
				  <option value="v{option}">v{option}</option>
				{/each}
			  </select>
			  <button
				class="text-blue-500 hover:text-blue-700 focus:outline-none"
				on:click={sendMessage}
			  >
				<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
				  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
				</svg>
			  </button>
			</div>
		  </div>
		</div>
		
		{#if showFileUpload}
		  <div class="file-upload-area bg-gray-100 p-2 rounded-b-lg" transition:slide>
			<input id="file-upload" type="file" multiple class="hidden" on:change={handleFileUpload} />
			<label for="file-upload" class="bg-gray-800 hover:bg-black text-white font-bold py-1 px-3 rounded cursor-pointer text-sm">
			  Choose Files
			</label>
			{#if files.length > 0}
			  <div class="mt-2 space-y-1">
				{#each files as file, index}
				  <div class="flex items-center justify-between bg-white p-1 rounded">
					<span class="text-sm truncate">{file.name}</span>
					<button on:click={() => removeFile(index)} class="text-black-500 ml-2 focus:outline-none">
					  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
					  </svg>
					</button>
				  </div>
				{/each}
			  </div>
			{/if}
		  </div>
		{/if}
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
		z-index: -1;
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
