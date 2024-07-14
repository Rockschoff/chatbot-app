<script>
	export let score;
	export let maxScore;

	let percentage = (score / maxScore) * 100;
	let strokeDasharray = `${percentage} 100`;

	// Determine color based on score
	let colorClass =
		score >= maxScore * 0.7
			? 'text-green-500'
			: score >= maxScore * 0.4
				? 'text-orange-500'
				: 'text-red-500';
</script>

<svg class="w-12 h-12" viewBox="0 0 48 48">
	<circle
		class="text-gray-300"
		stroke-width="4"
		stroke="currentColor"
		fill="transparent"
		r="18"
		cx="24"
		cy="24"
	/>
	<circle
		class={colorClass}
		stroke-width="4"
		stroke-dasharray={strokeDasharray}
		stroke-linecap="round"
		stroke="currentColor"
		fill="transparent"
		r="18"
		cx="24"
		cy="24"
	/>
	<text x="50%" y="50%" text-anchor="middle" dy=".3em" class={`text-xs fill-current ${colorClass}`}>
		{score}/{maxScore}
	</text>
</svg>

<style>
	svg {
		/* transform: rotate(-90deg); */
	}

	circle {
		transition: stroke-dasharray 0.3s;
	}
</style>
