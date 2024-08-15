<script lang="ts">
	import { onMount, createEventDispatcher } from 'svelte';
	import Message from './Message.svelte';
	import OpenAI from 'openai';
	import * as pdfjsLib from 'pdfjs-dist';
	import {slide} from "svelte/transition"
	import {v4 as uuidv4} from "uuid"
	// import * as XLSX from 'xlsx';
	// import Papa from 'papaparse';
	// import mammoth from 'mammoth';
	// import JSZip from 'jszip';
	import getFileText from './fileReader';
	import getResponse, {GetToolResponse , getThreadName} from "../../../lib/openAICaller"
	import { faL, faScrollTorah } from '@fortawesome/free-solid-svg-icons';

	const dispatch = createEventDispatcher();

	export let user_id: string;
	

	interface citation {
		file_id: string;
		text: string;
		start_index: number | null;
		end_index: number | null;
	}

	interface MessageContent {
		messageId : string;
		profilePicUrl: string;
		senderName: string;
		messageTime: string;
		messageText: string;
		citationList: citation[] | null;
		metadata : {liked : boolean ; disliked : boolean ; comment : string}
	}

	let file_text: string = '';
	export let messageContentList: MessageContent[];
	let files: File[] = [];
	let messageInput = '';
	export let threadId: string | null;
	let isActive : boolean = false;
	let showFileUpload : boolean = false;
	let isLoading : boolean = false;

	const openai = new OpenAI({
		apiKey: import.meta.env.VITE_OPENAI_APIKEY,
		dangerouslyAllowBrowser: true
	});
	async function handleEnterPress(event) {
		if (event.key === 'Enter') sendMessage();
	}
	function isSafari() {
		return /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
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
		pdfjsLib.GlobalWorkerOptions.workerSrc =
			'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.9.359/pdf.worker.min.js';

		scrollToBottom();
		document.addEventListener("click" , handleClickOutside);
	});

	
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
				messageId : uuidv4(),
				profilePicUrl: '',
				senderName: 'Me',
				messageTime: new Date().toLocaleTimeString(),
				messageText: messageInput,
				citationList: [],
				metadata : {liked : false , disliked : false , comment : ""}
			};
			messageContentList = [...messageContentList, newMessage];
			const generated_thread_name =  getThreadName(isSafari()?messageContentList[1].messageText:messageContentList[0].messageText)
			dispatch('newMessage', {
				num_messages: messageContentList.length,
				user_id: user_id,
				thread_id: threadId,
				thread_name: generated_thread_name,
				message_content: newMessage
			});
			dispatch("generationStart")
			scrollToBottom();
			isLoading = true
			console.log("sedningmessage to opneai")
			await sendToOpenAI(messageInput);
			console.log("got the message from openai")
			isLoading = false
			dispatch("generationStop")
			dispatch('newMessage', {
				num_messages: messageContentList.length,
				user_id: user_id,
				thread_id: threadId,
				message_content: messageContentList[messageContentList.length - 1]
			});
			messageInput = '';
			file_text = ''; // Clear input after sending
		}
	}

	async function sendToOpenAI(userInput: string) {
		if (!threadId) return;

		const content = file_text
			? `Uploaded File Text: ${file_text}\n\nUser Input: ${userInput}`
			: userInput;

		console.log('content : ', content);
		await openai.beta.threads.messages.create(threadId, { role: 'user', content });
		console.log("message added to thread")
		try{

			
			const stream = await openai.beta.threads.runs.create(threadId, {
				assistant_id: import.meta.env.VITE_ASSISTANTID, 
				stream: true,
				tool_choice: 'required'
			});
			

			let botMessage: MessageContent = {
				messageId: uuidv4(),
				profilePicUrl: './small_logo.png',
				senderName: 'In-Q Center',
				messageTime: new Date().toLocaleTimeString(),
				messageText: '',
				citationList: [],
				metadata : {liked : false , disliked : false , comment : ""}
			};
			messageContentList = [...messageContentList, botMessage];
			scrollToBottom()

			for await (const event of stream) {
				if (event.event === "thread.run.requires_action"){
					const tool_calls = event.data.required_action?.submit_tool_outputs.tool_calls
					await TakeRequiredActions(tool_calls , event.data.id)
					break
				}
				if (event.event === 'thread.message.delta') {
					// const lastMessage = messageContentList[messageContentList.length - 1];
					// console.log(event.data.delta.content[0].text)
					if (!event.data.delta.content[0].text.annotations || event.data.delta.content[0].text.annotations?.length == 0) {
						messageContentList[messageContentList.length - 1].messageText += event.data.delta.content[0].text.value;
								
					}else if(event.data.delta.content[0].text.annotations?.length > 0){
						// console.log(event.data.delta.content[0].text)
						messageContentList[messageContentList.length - 1].messageText += ` [\[ref\]](./dashboard/${event.data.delta.content[0].text.annotations[0].file_citation.file_id}) `
						event.data.delta.content[0].text.annotations.forEach((ele:any) => {
							if (ele?.file_citation) {
								const ref: citation = {
									file_id: ele.file_citation.file_id,
									text: ele.text,
									start_index: ele.start_index,
									end_index: ele.end_index
								};
								// Check if citation with the same file_id already exists
								const citationExists = messageContentList[messageContentList.length - 1].citationList?.some(
									(citation) => citation.file_id === ref.file_id
								);
								// Add ref only if it doesn't already exist
								if (!citationExists) {
									messageContentList[messageContentList.length - 1].citationList?.push(ref);
								}
							}
						});
					}
					scrollToBottom();
				}
			}

		}catch(err){
			console.log(err)
		}		
	}

	async function TakeRequiredActions(tool_calls : any , run_id : string){
		if(!threadId){
			console.error("Thread Id not defined")
		}
		console.log("getting tool reponse")
		const toolResponse = await GetToolResponse(tool_calls);
		console.log("got tool reponse" , toolResponse)

		const stream = await openai.beta.threads.runs.submitToolOutputs(
			threadId,
			run_id,
			{
				"tool_outputs" : toolResponse,
				"stream" : true
			}
		)

		for await (const event of stream) {
				if (event.event === "thread.run.requires_action"){
					const tool_calls = event.data.required_action?.submit_tool_outputs.tool_calls
					await TakeRequiredActions(tool_calls , event.data.id)
					break
				}
				if (event.event === 'thread.message.delta') {
					// const lastMessage = messageContentList[messageContentList.length - 1];
					// console.log(event.data.delta.content[0].text)
					if (!event.data.delta.content[0].text.annotations || event.data.delta.content[0].text.annotations?.length == 0) {
						messageContentList[messageContentList.length - 1].messageText += event.data.delta.content[0].text.value;
					}else if(event.data.delta.content[0].text.annotations?.length > 0){
						// console.log("got annotations" , event.data.delta.content[0].text)
						messageContentList[messageContentList.length - 1].messageText += ` [\[ref\]](./dashboard/${event.data.delta.content[0].text.annotations[0].file_citation.file_id}) `
						event.data.delta.content[0].text.annotations.forEach((ele) => {
							if (ele?.file_citation) {
								const ref: citation = {
									file_id: ele.file_citation.file_id,
									text: ele.text,
									start_index: ele.start_index,
									end_index: ele.end_index
								};
								// Check if citation with the same file_id already exists
								const citationExists = messageContentList[messageContentList.length - 1].citationList?.some(
									(citation) => citation.file_id === ref.file_id
								);
								// Add ref only if it doesn't already exist
								if (!citationExists) {
									messageContentList[messageContentList.length - 1].citationList?.push(ref);
								}
							}
						});
					}
					scrollToBottom();
				}
			}

	}

	// async function sendToOpenAI(userText : string){
	// 	if(!threadId){
	// 		return
	// 	}


	// 	const content = file_text
	// 	? `Uploaded File Text: ${file_text}\n\nUser Input: ${userText}`
	// 	: userText;
		
	// 	const thread = messageContentList.map((ele)=>{return {role : ele.senderName=="Me"?"user":"assistant" , content : ele.messageText}})

	// 	let botMessage: MessageContent = {
	// 		profilePicUrl: './small_logo.png',
	// 		senderName: 'In-Q Center',
	// 		messageTime: new Date().toLocaleTimeString(),
	// 		messageText: '',
	// 		citationList: []
	// 	};
	// 	messageContentList = [...messageContentList, botMessage];

	// 	const botText :  string = await getResponse(thread);
	// 	messageContentList[messageContentList.length-1].messageText = botText;
	// 	scrollToBottom()

	// }

	function removeFile(index: number) {
		files = files.filter((_, i) => i !== index);
	}

	function toggleFileUpload(){
		showFileUpload = !showFileUpload;
	}
	function toggleIsActive(){
		isActive = !isActive;
	}
	function handleClickOutside(event : any){
		if (!event.target.closest('#input-area')) {
			isActive = false;
			}
	}

	// let isMobileInputExpanded = false;
</script>

<div class="flex flex-col h-full w-full justify-between p-0 md:p-4">
	<div class="message-container p-2 md:p-3 space-y-4 relative w-full h-full mb-16 md:mb-0">
		{#each messageContentList as message}
			<Message {...message} {threadId} userId={user_id}/>
		{/each}
	</div>

	<div id="input-area" class="input-area fixed bottom-0 left-0 right-0 md:relative bg-white md:bg-transparent transition duration-300 border {isActive ? "border-blue-500" : "border-gray-400"} w-full rounded-t-lg md:rounded-lg shadow-lg md:shadow-none" on:click={toggleIsActive}>
		<div class="flex flex-col md:flex-row items-center space-y-2 md:space-y-0 md:space-x-2 p-2">
			<div class="relative flex-grow w-full">
				<input
				placeholder="Type your message here"
				class="form-input w-full py-2 px-4 pr-24 rounded-lg border-none focus:outline-none {isLoading ? "bg-gray-100": "bg-transparent"}"
				bind:value={messageInput}
				on:keypress={handleEnterPress}
				disabled={isLoading}
				id="Enter message here"
			/>
			<div class="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center space-x-2">
			  <button class="text-gray-500 hover:text-blue-500 focus:outline-none" on:click={toggleFileUpload} title="Add Attachments" >
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
			  <button
				class="text-blue-500 hover:text-blue-700 focus:outline-none"
				disabled={isLoading}
				on:click={sendMessage}
				id="send-message"
				title="Submit"
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
			<label for="file-upload" class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-3 rounded cursor-pointer text-sm">
			  Choose Files
			</label>
			{#if files.length > 0}
			  <div class="mt-2 space-y-1">
				{#each files as file, index}
				  <div class="flex items-center justify-between bg-white p-1 rounded">
					<span class="text-sm truncate">{file.name}</span>
					<button on:click={() => removeFile(index)} class="text-red-500 ml-2 focus:outline-none"  title="Remove File">
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

	@media (max-width: 768px) {
        .message-container {
            padding-bottom: 80px; /* Adjust based on your input area height */
        }

        .input-area {
            position: fixed;
            bottom: 0;
            left: 0;
            width: 100%;
            z-index: 40;
            padding: 10px;
            box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
        }
    }

	
</style>