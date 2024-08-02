<script lang="ts">
	import Sidebar from './components/Sidebar.svelte';
	import Chatbox from './components/Chatbox.svelte';
	import { onMount } from 'svelte';
	import { auth } from '../../lib/firebase/firebase.client';

	let user_id: string;
	let user_name: string | null;
	let user_entry: any;
	let threads: { threadId: string; threadName: string }[] = [];
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

	async function handleNewChat(event: CustomEvent) {
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
</script>

<div class="main-container bg-gray-200">
	<div class="sidebar"><Sidebar on:newChat={handleNewChat} {threads} {user_id} {user_entry} /></div>
	<div class="chat-window bg-gray-200 shadow-md">
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

	.chat-window {
		border-radius: 20px; /* Smaller radius on smaller screens */
	}

	@media (min-width: 768px) {
		/* Adjustments for tablets and desktops */
		.main-container {
			flex-direction: row;
		}

		.sidebar {
			width: 25%; /* Larger sidebar on wider screens */
			display: block; /* Ensure the sidebar is visible on larger screens */
		}

		.chat-window {
			width: 75%;
			border-radius: 50px;
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
