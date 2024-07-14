<script lang="ts">
	import { onMount, tick } from 'svelte';

	interface Review {
		profilePicUrl: string;
		name: string;
		designation: string;
		company: string;
		rating: number;
		reviewText: string;
	}

	let reviews: Review[] = [
		{
			profilePicUrl: 'https://via.placeholder.com/150',
			name: 'John Doe',
			designation: 'Chief Compliance Officer',
			company: 'Acme Corp',
			rating: 5,
			reviewText:
				'The IN-Q Knowledge Center has significantly streamlined our compliance processes. Highly recommended!'
		},
		{
			profilePicUrl: '',
			name: 'Jane Smith',
			designation: 'Regulatory Affairs Specialist',
			company: 'Beta LLC',
			rating: 4,
			reviewText:
				'Very helpful in navigating complex regulatory frameworks with ease and expertise.'
		},
		{
			profilePicUrl: 'https://via.placeholder.com/150',
			name: 'Emily Johnson',
			designation: 'Quality Assurance Manager',
			company: 'Gamma Inc',
			rating: 5,
			reviewText:
				'IN-Q is an indispensable tool for ensuring our operations remain compliant with ever-changing regulations.'
		}
	];

	let currentIndex = 0;

	function next() {
		currentIndex = (currentIndex + 1) % reviews.length;
	}

	function prev() {
		currentIndex = (currentIndex - 1 + reviews.length) % reviews.length;
	}
</script>

<div class="max-w-lg mx-auto relative overflow-hidden shadow-lg rounded-lg">
	<div class="flex transition-transform" style:transform={`translateX(-${currentIndex * 100}%)`}>
		{#each reviews as review}
			<div class="flex-none w-full flex flex-col items-center p-4 space-y-3">
				<div class="w-24 h-24 bg-gray-200 rounded-full overflow-hidden">
					{#if review.profilePicUrl}
						<img src={review.profilePicUrl} alt={review.name} class="w-full h-full object-cover" />
					{:else}
						<div class="w-full h-full flex items-center justify-center bg-gray-300">
							<span class="text-lg font-semibold">No Image</span>
						</div>
					{/if}
				</div>
				<div>
					<p class="text-xl font-bold">{review.name}</p>
					<p class="text-sm text-gray-600">{review.designation} at {review.company}</p>
					<p class="text-yellow-400">
						{Array.from({ length: review.rating }).map(() => '★')}
						{Array.from({ length: 5 - review.rating }).map(() => '☆')}
					</p>
					<p class="text-gray-800">{review.reviewText}</p>
				</div>
			</div>
		{/each}
	</div>
	<button
		class="absolute left-0 top-1/2 transform -translate-y-1/2 p-2 text-white bg-blue-700 rounded-full"
		on:click={prev}>&lt;</button
	>
	<button
		class="absolute right-0 top-1/2 transform -translate-y-1/2 p-2 text-white bg-blue-700 rounded-full"
		on:click={next}>&gt;</button
	>
</div>

<style>
	button {
		opacity: 0;
		transition: background-color 0.3s;
	}
	button:hover {
		opacity: 1;
		background-color: blue-800;
	}
</style>
