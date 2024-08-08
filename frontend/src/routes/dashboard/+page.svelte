<script lang="ts">
	import Sidebar from './components/Sidebar.svelte';
	import Chatbox from './components/Chatbox.svelte';
	import { onMount } from 'svelte';
	import { auth } from '../../lib/firebase/firebase.client';
	import { authStore, authHandlers } from '../../stores/authStore';

	let user_id: string;
	let user_name: string | null;
	let user_entry: any;
	let threads: { threadId: string; threadName: string }[] = [];
	let show_sidebar : boolean = false;
	const backendUrl = import.meta.env.VITE_BACKEND_URL;

	interface citation {
		file_id: string;
		text: string;
		start_index: number | null;
		end_index: number | null;
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

	let messageContentList: MessageContent[] = [];

	let threadId: string = '';

	function getCurrentDateTime() {
		const now = new Date();
		const date = now.toLocaleDateString('en-US');
		const time = now.toLocaleTimeString('en-US');
		return `${date} ${time}`;
	}

	async function getThreadId() {
		try {
			const response = await fetch(`${backendUrl}/get-thread-id`);
			if (!response.ok) {
				throw Error('Failed to fetch threadId');
			}
			const data = await response.json();
			return data.threadId;
		} catch (error) {
			console.error('Failed to fetch threadId', error);
		}
	}

	onMount(() => {
		let unsubscribe: () => void;

		const setup = async () => {
			try {
				// const thread = await openai.beta.threads.create();
				// threadId = thread.id;
				threadId = await getThreadId();

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

			const data = await response.json();
			threads = data.length ? data : [];
			console.log(data);
		} catch (error) {
			console.error('Error fetching threads:', error);
			threads = [{ threadId: '0x', threadName: 'Unavailable' }];
		}
	}

	async function handleNewChat(event: CustomEvent | {detail : {retrieval : boolean}}) {
		if (!event.detail.retrieval) {
			try {
				threadId = await getThreadId();
				messageContentList = [];
			} catch (error) {
				console.error('Error creating new chat:', error);
			}
		} else {
			try {
				const loadResponse = await fetch(`${backendUrl}/load-messages`, {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json'
					},
					body: JSON.stringify({ user_id: event.detail.user_id, thread_id: event.detail.threadId })
				});
				if (!loadResponse.ok) {
					throw new Error('Failed to load messages');
				}

				const messages = await loadResponse.json();
				messageContentList = [...messages];
				threadId = event.detail.threadId;
				console.log(messageContentList);
			} catch (error) {
				throw console.error('Unable to load chat', error);
			}
		}
	}

	async function handleNewMessage(event: CustomEvent) {
		if (event.detail.numMessages) {
			loadThreads();
		}
	}

	async function logout(){
		await authHandlers.logout()
	}
</script>

<div class="main-container bg-gray-200">
	<div class="sidemenu bg-gray-700 h-full w-20 flex flex-col justify-between items-center p-5">
		<div class="flex flex-col items-center space-y-4">
		  <svg id="chat-history" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" class="w-10 h-10 {show_sidebar?"fill-gray-400":"fill-gray-500"} hover:fill-gray-400" on:click={()=>{show_sidebar = !show_sidebar}}>
			<path d="M32 32l448 0c17.7 0 32 14.3 32 32l0 32c0 17.7-14.3 32-32 32L32 128C14.3 128 0 113.7 0 96L0 64C0 46.3 14.3 32 32 32zm0 128l448 0 0 256c0 35.3-28.7 64-64 64L96 480c-35.3 0-64-28.7-64-64l0-256zm128 80c0 8.8 7.2 16 16 16l160 0c8.8 0 16-7.2 16-16s-7.2-16-16-16l-160 0c-8.8 0-16 7.2-16 16z"/>
		  </svg>
		  <svg id="new-chat" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" class="w-10 h-10 fill-gray-500 hover:fill-blue-400" on:click={()=>{handleNewChat({detail:{retrieval : false}})}}>
			<path d="M256 512A256 256 0 1 0 256 0a256 256 0 1 0 0 512zM232 344l0-64-64 0c-13.3 0-24-10.7-24-24s10.7-24 24-24l64 0 0-64c0-13.3 10.7-24 24-24s24 10.7 24 24l0 64 64 0c13.3 0 24 10.7 24 24s-10.7 24-24 24l-64 0 0 64c0 13.3-10.7 24-24 24s-24-10.7-24-24z"/>
		  </svg>
		</div>
		<svg id="logout" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" class="w-10 h-10 fill-gray-500 hover:fill-red-400" on:click={logout}>
		  <path d="M377.9 105.9L500.7 228.7c7.2 7.2 11.3 17.1 11.3 27.3s-4.1 20.1-11.3 27.3L377.9 406.1c-6.4 6.4-15 9.9-24 9.9c-18.7 0-33.9-15.2-33.9-33.9l0-62.1-128 0c-17.7 0-32-14.3-32-32l0-64c0-17.7 14.3-32 32-32l128 0 0-62.1c0-18.7 15.2-33.9 33.9-33.9c9 0 17.6 3.6 24 9.9zM160 96L96 96c-17.7 0-32 14.3-32 32l0 256c0 17.7 14.3 32 32 32l64 0c17.7 0 32 14.3 32 32s-14.3 32-32 32l-64 0c-53 0-96-43-96-96L0 128C0 75 43 32 96 32l64 0c17.7 0 32 14.3 32 32s-14.3 32-32 32z"/>
		</svg>
	  </div>
	<div class="sidebar {show_sidebar?"show":"hidden"}"><Sidebar on:newChat={handleNewChat} {threads} {user_id} {user_entry} /></div>
	<div class="chat-window bg-gray-200 shadow-md w-full">
		<Chatbox on:newMessage={handleNewMessage} {threadId} {user_id} {messageContentList} />
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

	

	@media (min-width: 768px) {
		/* Adjustments for tablets and desktops */
		.main-container {
			flex-direction: row;
		}

		.sidebar{
			width : 25%;
		}
		
		.chat-window {
		
			
		}
	}

	@media (max-width: 767px) {
		.sidebar {
			display: none; /* Hide sidebar on smaller screens */
		}

		.chat-window {
			width: 100%;
			flex-grow: 1;
			 /* Remove border radius for full-width appearance */
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
