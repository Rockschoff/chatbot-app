<script lang="ts">
	import Sidebar from './components/Sidebar.svelte';
	import Chatbox from './components/Chatbox.svelte';
	import OpenAI from 'openai';
	import { onMount } from 'svelte';
	import { auth } from '../../lib/firebase/firebase.client';

	let user_id: string;
	let threads: { thread_id: string; thread_name: string }[] = [];

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

	let messageContentList: MessageContent[] = [];

	const openai = new OpenAI({
		apiKey: import.meta.env.VITE_OPENAI_APIKEY,
		dangerouslyAllowBrowser: true
	});

	let threadId: string | null = null;

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
				threadId = thread.id;

				unsubscribe = auth.onAuthStateChanged((user) => {
					if (user) {
						user_id = user.uid;
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
		} catch (error) {
			console.error('Error fetching threads:', error);
			threads = [{ thread_id: '0x', thread_name: 'Unavailable' }];
		}
	}

	async function handleNewChat(event: CustomEvent) {
		console.log('handle new chat', event.detail.retrieval);
		if (!event.detail.retrieval) {
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

				const messages = await loadResponse.json();
				messageContentList = messages;

				// Delete the old thread
				const deleteResponse = await fetch(`${backendUrl}/delete-thread`, {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json'
					},
					body: JSON.stringify({
						user_id: event.detail.user_id,
						thread_id: event.detail.thread_id,
						thread_name: event.detail.thread_name
					})
				});

				if (!deleteResponse.ok) {
					throw new Error('Failed to delete old thread');
				}

				console.log('Old thread deleted successfully');

				// Create a new thread with OpenAI
				const newThread = await openai.beta.threads.create();
				threadId = newThread.id;

				// Add the new thread with the old name
				await addThread(threadId, event.detail.thread_name);

				// Reload threads to reflect changes
				await loadThreads();

				console.log('New thread created and added successfully:', threadId);

				// Add messages to the new thread
				for (const message of messageContentList) {
					await handleNewMessage({
						detail: {
							user_id: event.detail.user_id,
							thread_id: threadId,
							message_content: message,
							num_messages: messageContentList.length
						}
					} as CustomEvent);
				}
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
			await addThread(
				threadId,
				event.detail.thread_name ? event.detail.thread_name : getCurrentDateTime()
			);
			await loadThreads();
			console.log('New thread was added');
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
				console.log(response);
				throw new Error('Failed to add message');
			}

			console.log('Message added successfully');
		} catch (error) {
			console.error('Error adding message:', error);
		}
	}
</script>

<div class="main-container bg-gray-200">
	<div class="sidebar"><Sidebar on:newChat={handleNewChat} {threads} {user_id} /></div>
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
