<script lang="ts">
	import Sidebar from './components/Sidebar.svelte';
	import Chatbox from './components/Chatbox.svelte';
	import OpenAI from 'openai';
	import { onMount } from 'svelte';
	import { auth } from '../../lib/firebase/firebase.client';
	import {authHandlers} from "../../stores/authStore"
	import {goto} from "$app/navigation"
	// import {v4 as uuidv4} from "uuid"

	let user_id: string;
	let user_name: string | null;
	let user_entry: any;
	let threads: { thread_id: string; thread_name: string }[] = [];
	let showSidebar: boolean = false
	let isGenerating : boolean = false;
	

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

	let messageContentList: MessageContent[] = [];

	const openai = new OpenAI({
		apiKey: import.meta.env.VITE_OPENAI_APIKEY,
		dangerouslyAllowBrowser: true
	});

	let threadId: string = '';

	function getCurrentDateTime() {
		const now = new Date();
		const date = now.toLocaleDateString('en-US');
		const time = now.toLocaleTimeString('en-US');
		return `${date} ${time}`;
	}

	const backendUrl = import.meta.env.VITE_BACKEND_URL;

	onMount(() => {
		let unsubscribe: () => void;

		const setup = async () => {
			try {
				const thread = await openai.beta.threads.create();
				
				threadId =  thread.id //uuidv4()
				
				unsubscribe = auth.onAuthStateChanged((user) => {
					if (user) {
						user_id = user.uid;
						user_name = user.displayName;
						console.log('user has loaded with id : ', user.uid);
						loadThreads();
					} else {
						console.log('user has been unloaded');
					}
				});
			} catch (error) {
				console.error('Error in onMount setup:', error);
			}
		};

		const load_user_entry = async () => {
			try {
				const response = await fetch(`${backendUrl}/get-user`, {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json'
					},
					body: JSON.stringify({ user_id: user_id, user_name: user_name })
				});

				if (!response.ok) {
					throw new Error('Failed to fetch threads');
				}

				user_entry = await response.json();
				console.log(user_entry);
			} catch (e) {
				console.error('Error getting user entry', e);
			}
		};

		setup();

		return () => {
			if (unsubscribe) {
				unsubscribe();
			}
		};
	});

	async function loadThreads() {
		console.log('load_threads');
		try {
			const response = await fetch(`${backendUrl}/get-threads`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ user_id: user_id })
			});

			if (!response.ok) {
				throw new Error('Failed to fetch threads');
			}
			
			threads=[]
			const data = await response.json();
			threads = data.length ? data : [];
		} catch (error) {
			console.error('Error fetching threads:', error);
			threads = [{ thread_id: '0x', thread_name: 'Unavailable' }];
		}
	}

	async function handleNewChat(event: CustomEvent | {detail : {retrieval : boolean}}) {
		
		console.log('handle new chat', event.detail.retrieval);
		if (!event.detail.retrieval) {
			if(isGenerating){
				return
			}
			try {
				const thread = await openai.beta.threads.create();
				threadId = thread.id;
				messageContentList = [];
			} catch (error) {
				console.error('Error creating new chat:', error);
			}
		} else {
			console.log('Retrieving and recreating chat', event.detail);
			try {
				// Load messages for the retrieved thread
				const loadResponse = await fetch(`${backendUrl}/load-messages`, {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json'
					},
					body: JSON.stringify({ user_id: event.detail.user_id, thread_id: event.detail.thread_id })
				});

				if (!loadResponse.ok) {
					throw new Error('Failed to load messages');
				}

				//Set current thread id to the selected thread
				threadId = event.detail.thread_id

				messageContentList=[]
				const messages = await loadResponse.json();
				
				messageContentList = messages;
				// messageContentList.map((ele)=>{console.log(ele)})

				// Delete the old thread
				// const deleteResponse = await fetch(`${backendUrl}/delete-thread`, {
				// 	method: 'POST',
				// 	headers: {
				// 		'Content-Type': 'application/json'
				// 	},
				// 	body: JSON.stringify({
				// 		user_id: event.detail.user_id,
				// 		thread_id: event.detail.thread_id,
				// 		thread_name: event.detail.thread_name
				// 	})
				// });

				// if (!deleteResponse.ok) {
				// 	throw new Error('Failed to delete old thread');
				// }

				// console.log('Old thread deleted successfully');

				// Create a new thread with OpenAI
				// const newThread = await openai.beta.threads.create();
				// threadId = newThread.id;

				// Add the new thread with the old name
				// await addThread(threadId, event.detail.thread_name);

				// Reload threads to reflect changes
				await loadThreads();

				// console.log('New thread created and added successfully:', threadId);

				// Add messages to the new thread
				// for (const message of messageContentList) {
				// 	await handleNewMessage({
				// 		detail: {
				// 			user_id: event.detail.user_id,
				// 			thread_id: threadId,
				// 			message_content: message,
				// 			num_messages: messageContentList.length
				// 		}
				// 	} as CustomEvent);
				// }
			} catch (error) {
				console.error('Error retrieving and recreating chat:', error);
			}
			
		}
	}

	async function addThread(thread_id: string | null, thread_name: string) {
		try {
			const response = await fetch(`${backendUrl}/add-thread`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ user_id, thread_id, thread_name })
			});

			if (!response.ok) {
				throw new Error('Failed to add thread');
			}

			console.log('Thread added successfully');
		} catch (error) {
			console.error('Error adding thread:', error);
		}
	}

	async function handleNewMessage(event: CustomEvent) {
		if (event.detail.num_messages == 1) {
			const name = await event.detail.thread_name
			console.log("Got the name" , name)
			await addThread(
				threadId,
				name
			);
			console.log("Added the thread")
			console.log("new thread was added with name : " , name )
			await loadThreads();
			console.log('New thread was added' , threads);
		}

		try {
			const response = await fetch(`${backendUrl}/add-message`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					user_id: event.detail.user_id,
					thread_id: event.detail.thread_id,
					messageContent: event.detail.message_content
				})
			});

			if (!response.ok) {
				console.log(response , event.detail.message_content );
				throw new Error('Failed to add message');
			}

			console.log('Message added successfully');
		} catch (error) {
			console.error('Error adding message:', error);
		}
	}

	async function logout(){
		await authHandlers.logout()
	}

	function generationStart(){
		isGenerating = true;
	}
	function generationStop(){
		isGenerating = false;
	}
</script>

<div class="main-container bg-gray-200">
	<div class="sidemenu bg-gray-700 h-full w-20 flex flex-col justify-between items-center p-5">
		<div class="flex flex-col items-center space-y-4">
			<div class="icon-container flex flex-col items-center">
				<svg id='profile' xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" class="w-10 h-10 fill-gray-500 hover:fill-blue-400" on:click={()=>{isGenerating? null :goto("/dashboard/profile")}}>
					<path d="M304 128a80 80 0 1 0 -160 0 80 80 0 1 0 160 0zM96 128a128 128 0 1 1 256 0A128 128 0 1 1 96 128zM49.3 464l349.5 0c-8.9-63.3-63.3-112-129-112l-91.4 0c-65.7 0-120.1 48.7-129 112zM0 482.3C0 383.8 79.8 304 178.3 304l91.4 0C368.2 304 448 383.8 448 482.3c0 16.4-13.3 29.7-29.7 29.7L29.7 512C13.3 512 0 498.7 0 482.3z"/>
				</svg>
				<span class="icon-label text-gray-500 text-xs">Profile</span>
			</div>
			<div class="icon-container flex flex-col items-center">
				<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" class="w-10 h-10 {showSidebar?'fill-gray-400':'fill-gray-500'} hover:fill-gray-400" on:click={()=>{showSidebar = !showSidebar}}>
					<!--!Font Awesome Free 6.6.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2024 Fonticons, Inc.-->
					<path d="M121 32C91.6 32 66 52 58.9 80.5L1.9 308.4C.6 313.5 0 318.7 0 323.9L0 416c0 35.3 28.7 64 64 64l384 0c35.3 0 64-28.7 64-64l0-92.1c0-5.2-.6-10.4-1.9-15.5l-57-227.9C446 52 420.4 32 391 32L121 32zm0 64l270 0 48 192-51.2 0c-12.1 0-23.2 6.8-28.6 17.7l-14.3 28.6c-5.4 10.8-16.5 17.7-28.6 17.7l-120.4 0c-12.1 0-23.2-6.8-28.6-17.7l-14.3-28.6c-5.4-10.8-16.5-17.7-28.6-17.7L73 288 121 96z"/>
				</svg>	
				<span class="icon-label text-gray-500 text-xs">History</span>
			</div>
			<div class="icon-container flex flex-col items-center">
				<svg id="new-chat" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" class="w-10 h-10 fill-gray-500 hover:fill-blue-400" on:click={()=>{handleNewChat({detail:{retrieval : false}})}}>
					<path d="M256 512A256 256 0 1 0 256 0a256 256 0 1 0 0 512zM232 344l0-64-64 0c-13.3 0-24-10.7-24-24s10.7-24 24-24l64 0 0-64c0-13.3 10.7-24 24-24s24 10.7 24 24l0 64 64 0c13.3 0 24 10.7 24 24s-10.7 24-24 24l-64 0 0 64c0 13.3-10.7 24-24 24s-24-10.7-24-24z"/>
				</svg>
				<span class="icon-label text-gray-500 text-xs">New</span>
			</div>
		</div>
		<div class="icon-container flex flex-col items-center">
			<svg id="logout" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" class="w-10 h-10 fill-gray-500 hover:fill-red-400" on:click={logout}>
			<path d="M377.9 105.9L500.7 228.7c7.2 7.2 11.3 17.1 11.3 27.3s-4.1 20.1-11.3 27.3L377.9 406.1c-6.4 6.4-15 9.9-24 9.9c-18.7 0-33.9-15.2-33.9-33.9l0-62.1-128 0c-17.7 0-32-14.3-32-32l0-64c0-17.7 14.3-32 32-32l128 0 0-62.1c0-18.7 15.2-33.9 33.9-33.9c9 0 17.6 3.6 24 9.9zM160 96L96 96c-17.7 0-32 14.3-32 32l0 256c0 17.7 14.3 32 32 32l64 0c17.7 0 32 14.3 32 32s-14.3 32-32 32l-64 0c-53 0-96-43-96-96L0 128C0 75 43 32 96 32l64 0c17.7 0 32 14.3 32 32s-14.3 32-32 32z"/>
			</svg>
			<span class="icon-label text-gray-500 text-xs">Logout</span>
		</div>
	  </div>
	<div class="sidebar {showSidebar?"show":"hidden"}"><Sidebar on:newChat={handleNewChat} {threads} {user_id} {user_entry} {isGenerating} /></div>
	<div class="chat-window w-full">
		<Chatbox on:newMessage={handleNewMessage} {threadId} {user_id} {messageContentList} 
		on:generationStart={generationStart} on:generationStop={generationStop}  />
	</div>
</div>

<style lang="postcss">
	.main-container {
		height: 90vh;
		width: 100vw;
		display: flex;
		flex-direction: column; /* Stack vertically on small screens */
	}

	.sidebar,
	.chat-window {
		width: 100%; /* Full width on small screens */
		height: auto;
	}

	.chat-window {
		border-radius: 20px; /* Smaller radius on smaller screens */
	}

	/* Tooltip styles */
	[aria-label] {
		position: relative;
		cursor: pointer;
	}

	[aria-label]::after {
		content: attr(aria-label);
		position: absolute;
		left: 100%;
		top: 50%;
		transform: translateY(-50%);
		background-color: rgba(0, 0, 0, 0.8);
		color: white;
		padding: 4px 8px;
		border-radius: 4px;
		font-size: 12px;
		white-space: nowrap;
		opacity: 0;
		visibility: hidden;
		transition: opacity 0.3s, visibility 0.3s;
		z-index: 10;
	}

	[aria-label]:hover::after {
		opacity: 1;
		visibility: visible;
	}

	.sidemenu {
		z-index: 5;
	}


	@media (min-width: 768px) {
		/* Adjustments for tablets and desktops */
		.main-container {
			flex-direction: row;
		}

		.sidebar{
			width : 25%;
		}

		.chat-window{
			background-color: #fdf6ed;
		}

		

		
	}

	@media (max-width: 767px) {
		.sidebar {
			display: none; /* Hide sidebar on smaller screens */
		}

		.chat-window {
			width: 100%;
			flex-grow: 1;
			border-radius: 0; /* Remove border radius for full-width appearance */
		}
	}

	input,
	button {
		transition: all 0.3s ease;
		outline: none; /* Removes default outline to customize focus */
	}

	input:focus,
	button:focus {
		box-shadow: 0 0 0 2px rgba(30, 144, 255, 0.5); /* Adds a glow effect on focus */
		transform: scale(1.03); /* Slightly enlarges the focused element */
	}

	button:hover {
		transform: translateY(-2px); /* Subtle lift effect on hover */
		box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1); /* Soft shadow for depth */
	}

	button:active {
		transform: translateY(1px); /* Button appears to be pressed down */
		box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2); /* Deeper shadow for clicked state */
	}
</style>
