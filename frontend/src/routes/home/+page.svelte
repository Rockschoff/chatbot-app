<script>
	import PlantDetails from './components/PlantDetails.svelte';

	let plants = [
		{
			name: 'Plant A',
			currentScore: 8,
			pastWeekScore: 7,
			forecastedScore: 5,
			maxScore: 15,
			details: [
				{
					name: 'Internal Audits',
					statusClass: 'text-red-500',
					statusIcon: '❗',
					score: 10,
					maxScore: 15
				},
				{
					name: 'Equipment Performance',
					statusClass: 'text-green-500',
					statusIcon: '✅',
					score: 15,
					maxScore: 15
				},
				{
					name: 'PC/CCP Deviations',
					statusClass: 'text-yellow-500',
					statusIcon: '⚠️',
					score: 12,
					maxScore: 15
				},
				{
					name: 'Material Suppliers',
					statusClass: 'text-red-500',
					statusIcon: '❗',
					score: 8,
					maxScore: 15
				},
				{
					name: 'Label Verifications',
					statusClass: 'text-green-500',
					statusIcon: '✅',
					score: 15,
					maxScore: 15
				}
			]
		},
		{
			name: 'Plant B',
			currentScore: 15,
			pastWeekScore: 15,
			forecastedScore: 15,
			maxScore: 15,
			details: [
				{
					name: 'Internal Audits',
					statusClass: 'text-green-500',
					statusIcon: '✅',
					score: 15,
					maxScore: 15
				},
				{
					name: 'Equipment Performance',
					statusClass: 'text-green-500',
					statusIcon: '✅',
					score: 15,
					maxScore: 15
				}
				// Add more details as needed
			]
		},
		{
			name: 'Plant C',
			currentScore: 13,
			pastWeekScore: 7,
			forecastedScore: 10,
			maxScore: 15,
			details: [
				{
					name: 'PC/CCP Deviations',
					statusClass: 'text-yellow-500',
					statusIcon: '⚠️',
					score: 12,
					maxScore: 15
				},
				{
					name: 'Material Suppliers',
					statusClass: 'text-red-500',
					statusIcon: '❗',
					score: 8,
					maxScore: 15
				}
				// Add more details as needed
			]
		},
		{
			name: 'Plant D',
			currentScore: 15,
			pastWeekScore: 15,
			forecastedScore: 15,
			maxScore: 15,
			details: [
				{
					name: 'Label Verifications',
					statusClass: 'text-green-500',
					statusIcon: '✅',
					score: 15,
					maxScore: 15
				},
				{
					name: 'Internal Audits',
					statusClass: 'text-green-500',
					statusIcon: '✅',
					score: 15,
					maxScore: 15
				}
				// Add more details as needed
			]
		}
	];

	let compliantCount = plants.filter((plant) => plant.currentScore >= plant.maxScore / 2).length;
</script>

<div class="bg-gradient-to-r from-pink-500 to-blue-500 text-white text-center py-10">
	<h1 class="text-4xl font-bold flex items-center justify-center space-x-4">
		<span class="bg-white text-blue-500 rounded-full px-4 py-2">
			{compliantCount}/{plants.length}
		</span>
		<span>plants are compliant...</span>
	</h1>
</div>

<div class="flex justify-between m-5 space-x-4">
	<input
		type="text"
		placeholder="Search..."
		class="p-3 border rounded-lg border-gray-300 flex-grow shadow-sm focus:ring focus:ring-blue-300"
	/>
	<div class="flex space-x-4">
		<select class="p-3 border rounded-lg border-gray-300 shadow-sm focus:ring focus:ring-blue-300">
			<option>Sort By:</option>
		</select>
		<button class="p-3 bg-blue-500 text-white rounded-lg shadow hover:bg-blue-600 transition">
			🔍
		</button>
	</div>
</div>

<div class="flex flex-col space-y-5 px-5">
	{#each plants as plant}
		<PlantDetails {plant} />
	{/each}
</div>
