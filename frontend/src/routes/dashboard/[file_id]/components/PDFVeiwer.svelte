<script>
	export let pdfUrl;
</script>

<iframe src={pdfUrl} width="100%" height="100%" style="border: none;"></iframe>

<style>
	iframe {
		height: 100vh; /* Full viewport height */
	}
</style>
