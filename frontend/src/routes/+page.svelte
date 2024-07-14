<script>
	import { authHandlers, authStore } from '../stores/authStore';
	import ReviewCarousel from './components/ReviewCarousal.svelte';

	let isCreatingAccount = false;
	let fname = '';
	let lname = '';
	let email = '';
	let password = '';
	let confirmPassword = '';
	let isFocused = false;

	async function handleSubmit() {
		if (!email || !password || (isCreatingAccount && !confirmPassword)) {
			console.log('Required fields are missing');
			return;
		}
		if (isCreatingAccount) {
			if (password !== confirmPassword) {
				console.log('Passwords do not match');
				return;
			}
			try {
				await authHandlers.signup(email, password, fname, lname);
				console.log('Signup successful, redirecting...');
				window.location.href = './dashboard';
			} catch (err) {
				console.log('Signup error:', err);
			}
		} else {
			try {
				await authHandlers.login(email, password);
				console.log('Login successful, redirecting...');
				window.location.href = './dashboard';
			} catch (err) {
				console.log('Login error:', err);
			}
		}
	}

	function toggleAccountCreation() {
		isCreatingAccount = !isCreatingAccount;
	}
</script>

<div class="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4 md:p-8 relative">
	<div class="absolute top-5 left-10 w-16 h-16 bg-pastel-pink rounded-full opacity-50"></div>
	<div class="absolute top-1/4 right-20 w-12 h-12 bg-pastel-green rounded-lg opacity-50"></div>
	<div class="absolute bottom-10 right-10 w-20 h-20 bg-pastel-blue rounded opacity-50"></div>
	<div
		class="absolute bottom-1/4 left-5 w-24 h-24 bg-pastel-yellow rounded-full opacity-50 transform rotate-45"
	></div>
	<div class="text-center mb-8">
		<h2 class="text-xl md:text-3xl font-bold text-blue-600">IN-Q Knowledge Center</h2>
		<p class="text-sm md:text-md text-gray-700 mt-2">
			A tool that will help with all your compliance needs. Expert validated and tested.
		</p>
	</div>
	<div
		class="bg-white p-4 md:p-8 rounded-lg shadow-lg max-w-md w-full {isFocused
			? 'ring-4 ring-blue-500 shadow-xl'
			: ''}"
		tabindex="-1"
	>
		<h1 class="text-lg md:text-2xl font-bold mb-4">
			{isCreatingAccount ? 'Create Account' : 'Login'}
		</h1>

		<form on:submit|preventDefault={handleSubmit}>
			{#if isCreatingAccount}
				<div class="mb-4">
					<label class="block text-gray-700 text-sm font-bold mb-2" for="fname">First Name</label>
					<input
						class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
						id="fname"
						type="text"
						bind:value={fname}
						placeholder="Enter your first name"
					/>
				</div>
				<div class="mb-4">
					<label class="block text-gray-700 text-sm font-bold mb-2" for="lname">Last Name</label>
					<input
						class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
						id="lname"
						type="text"
						bind:value={lname}
						placeholder="Enter your last name"
					/>
				</div>
			{/if}
			<div class="mb-4">
				<label class="block text-gray-700 text-sm font-bold mb-2" for="email">Email</label>
				<input
					class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
					id="email"
					type="email"
					bind:value={email}
					placeholder="Enter your email"
				/>
			</div>
			<div class="mb-4">
				<label class="block text-gray-700 text-sm font-bold mb-2" for="password">Password</label>
				<input
					class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
					id="password"
					type="password"
					bind:value={password}
					placeholder="Enter your password"
				/>
			</div>
			{#if isCreatingAccount}
				<div class="mb-6">
					<label class="block text-gray-700 text-sm font-bold mb-2" for="confirmPassword"
						>Confirm Password</label
					>
					<input
						class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
						id="confirmPassword"
						type="password"
						bind:value={confirmPassword}
						placeholder="Confirm your password"
					/>
				</div>
			{/if}
			<div class="flex items-center justify-between">
				<button
					class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
					type="button"
					on:click={toggleAccountCreation}
				>
					{isCreatingAccount ? 'Already have an account?' : 'Create an account'}
				</button>
				<button
					class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
					type="submit"
				>
					{isCreatingAccount ? 'Register' : 'Login'}
				</button>
			</div>
		</form>
	</div>
	<ReviewCarousel />
</div>

<!-- <script lang="ts">
	import { authHandlers, authStore } from '../stores/authStore';
	import ReviewCarousal from './components/ReviewCarousal.svelte';

	let isCreatingAccount = false;
	let fname = '';
	let lname = '';
	let email = '';
	let password = '';
	let confirmPassword = '';
	let isFocused = false;

	async function handleSubmit() {
		if (!email || !password || (isCreatingAccount && !confirmPassword)) {
			console.log('Required fields are missing');
			return;
		}
		if (isCreatingAccount) {
			if (password !== confirmPassword) {
				console.log('Passwords do not match');
				return;
			}
			try {
				await authHandlers.signup(email, password, fname, lname);
				console.log('Signup successful, redirecting...');
				window.location.href = './dashboard';
			} catch (err) {
				console.log('Signup error:', err);
			}
		} else {
			try {
				await authHandlers.login(email, password);
				console.log('Login successful, redirecting...');
				window.location.href = './dashboard';
			} catch (err) {
				console.log('Login error:', err);
			}
		}

		if ($authStore.currentUser) {
			window.location.href = '/dashboard';
		}
	}
	function toggleAccountCreation() {
		isCreatingAccount = !isCreatingAccount;
	}
</script>

<div class="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4 relative">
	<div class="text-center mb-8">
		<h2 class="text-3xl font-bold text-blue-600">IN-Q Knowledge Center</h2>
		<p class="text-md text-gray-700 mt-2">
			A chatbot that will help with all your compliance needs. Expert validated and tested.
		</p>
	</div>
	<div class="background-shapes">
		<div class="circle"></div>
		<div class="triangle"></div>
	</div>
	<div
		class="bg-white p-8 rounded-lg shadow-lg max-w-md w-full {isFocused
			? 'ring-4 ring-blue-500 shadow-xl'
			: ''}"
		tabindex="-1"
	>
		<h1 class="text-2xl font-bold mb-4">{isCreatingAccount ? 'Create Account' : 'Login'}</h1>

		<form on:submit|preventDefault={handleSubmit}>
			{#if isCreatingAccount}
				<div class="mb-4">
					<label class="block text-gray-700 text-sm font-bold mb-2" for="fname">First Name</label>
					<input
						class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
						id="fname"
						type="text"
						bind:value={fname}
						placeholder="Enter your first name"
					/>
				</div>
				<div class="mb-4">
					<label class="block text-gray-700 text-sm font-bold mb-2" for="lname">Last Name</label>
					<input
						class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
						id="lname"
						type="text"
						bind:value={lname}
						placeholder="Enter your last name"
					/>
				</div>
			{/if}
			<div class="mb-4">
				<label class="block text-gray-700 text-sm font-bold mb-2" for="email">Email</label>
				<input
					class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
					id="email"
					type="email"
					bind:value={email}
					placeholder="Enter your email"
				/>
			</div>
			<div class="mb-4">
				<label class="block text-gray-700 text-sm font-bold mb-2" for="password">Password</label>
				<input
					class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
					id="password"
					type="password"
					bind:value={password}
					placeholder="Enter your password"
				/>
			</div>
			{#if isCreatingAccount}
				<div class="mb-6">
					<label class="block text-gray-700 text-sm font-bold mb-2" for="confirmPassword"
						>Confirm Password</label
					>
					<input
						class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
						id="confirmPassword"
						type="password"
						bind:value={confirmPassword}
						placeholder="Confirm your password"
					/>
				</div>
			{/if}
			<div class="flex items-center justify-between">
				<button
					class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
					type="button"
					on:click={toggleAccountCreation}
				>
					{isCreatingAccount ? 'Already have an account?' : 'Create an account'}
				</button>
				<button
					class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
					type="submit"
				>
					{isCreatingAccount ? 'Register' : 'Login'}
				</button>
			</div>
		</form>
	</div>
	<ReviewCarousal />
</div> -->

<style>
	:global(.bg-pastel-pink) {
		--tw-bg-opacity: 1;
		background-color: rgba(244, 114, 182, var(--tw-bg-opacity));
	}
	:global(.bg-pastel-green) {
		--tw-bg-opacity: 1;
		background-color: rgba(174, 221, 129, var(--tw-bg-opacity));
	}
	:global(.bg-pastel-blue) {
		--tw-bg-opacity: 1;
		background-color: rgba(137, 207, 240, var(--tw-bg-opacity));
	}
	:global(.bg-pastel-yellow) {
		--tw-bg-opacity: 1;
		background-color: rgba(253, 253, 150, var(--tw-bg-opacity));
	}
</style>
