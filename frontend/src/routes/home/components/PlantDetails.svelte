<script>
	import CircularProgress from './CircularProgress.svelte';
	import { createEventDispatcher } from 'svelte';

	export let plant;

	let detailsVisible = false;

	const dispatch = createEventDispatcher();

	function toggleDetails() {
		detailsVisible = !detailsVisible;
		dispatch('toggle', { visible: detailsVisible });
	}
</script>

<div
	class="bg-white p-6 rounded-lg shadow-lg transition transform hover:scale-105 cursor-pointer"
	on:click={toggleDetails}
>
	<div class="flex justify-between items-center">
		<div class="text-xl font-semibold">{plant.name}</div>
		<div class="flex space-x-8">
			<div class="text-center">
				<div class="font-medium">Current Score:</div>
				<div class="mt-1">
					<CircularProgress score={plant.currentScore} maxScore={plant.maxScore} />
				</div>
			</div>
			<div class="text-center">
				<div class="font-medium">Past Week Score:</div>
				<div class="mt-1">
					<CircularProgress score={plant.pastWeekScore} maxScore={plant.maxScore} />
				</div>
			</div>
			<div class="text-center">
				<div class="font-medium">Forecasted Score:</div>
				<div class="mt-1">
					<CircularProgress score={plant.forecastedScore} maxScore={plant.maxScore} />
				</div>
			</div>
		</div>
		<div class="relative text-xl cursor-pointer">
			📝
			<div class="w-3 h-3 bg-red-500 rounded-full absolute top-0 right-0"></div>
		</div>
	</div>
	{#if detailsVisible}
		<div class="mt-4 bg-gray-100 p-4 rounded-lg animate-fade-in">
			{#each plant.details as detail}
				<div
					class="flex justify-between items-center p-4 bg-gray-200 rounded-lg mb-2 transition transform hover:scale-105"
				>
					<div class="text-left font-medium w-1/3">{detail.name}</div>
					<div class="flex items-center space-x-2 w-1/3 justify-center">
						<span>Status:</span>
						<span class={detail.statusClass}>{detail.statusIcon}</span>
					</div>
					<div class="w-1/3 flex justify-center">
						<CircularProgress score={detail.score} maxScore={detail.maxScore} />
					</div>
					<div class="w-1/3 flex justify-end">
						<button class="bg-blue-500 text-white p-2 rounded-lg transition hover:bg-blue-600">
							Monitor
						</button>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>

<style>
	.bg-gray-100 {
		background-color: #f3f4f6;
	}

	.bg-gray-200 {
		background-color: #e5e7eb;
	}

	.bg-blue-500:hover {
		background-color: #2563eb;
	}

	.rounded-lg {
		border-radius: 0.5rem;
	}

	.shadow-lg {
		box-shadow:
			0 10px 15px -3px rgba(0, 0, 0, 0.1),
			0 4px 6px -2px rgba(0, 0, 0, 0.05);
	}

	.hover\:scale-105:hover {
		transform: scale(1.05);
	}

	.transition {
		transition: all 0.2s;
	}

	@keyframes fade-in {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}

	.animate-fade-in {
		animation: fade-in 0.5s ease-in-out;
	}
</style>
