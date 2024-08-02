<script lang="ts">
	import { onMount, createEventDispatcher } from 'svelte';
	import Message from './Message.svelte';


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
	let selectedModelVersion = 'v1'; // Default to v1
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
			? messageContentList[0].messageText.substring(0, 10)
			: newMessage.messageText.substring(0, 10)
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
		  <select
			bind:value={selectedModelVersion}
			class="bg-white border border-gray-300 text-gray-700 py-2 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
		  >
			{#each Array(7) as _, i}
			  <option value="v{i+1}">v{i+1}</option>
			{/each}
		  </select>
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
