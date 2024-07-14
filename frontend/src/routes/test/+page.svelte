<script>
	import {
		storage,
		db,
		ref,
		uploadBytes,
		getDownloadURL,
		listAll,
		collection,
		addDoc,
		getDocs
	} from '../../lib/firebase/firebase.client';

	let file;
	let pdfList = [];

	async function uploadFile() {
		if (file) {
			const storageRef = ref(storage, file.name); // Upload to root
			await uploadBytes(storageRef, file);
			const url = await getDownloadURL(storageRef);
			await addDoc(collection(db, 'pdfs'), { name: file.name, url: url });
			file = null;
			fetchPDFs(); // Refresh the list after uploading
		}
	}

	async function fetchPDFs() {
		const listRef = ref(storage, '/');
		const res = await listAll(listRef);
		const files = await Promise.all(
			res.items.map(async (itemRef) => {
				const url = await getDownloadURL(itemRef);
				return { name: itemRef.name, url };
			})
		);
		pdfList = files;
	}

	fetchPDFs();
</script>

<div class="upload-section">
	<input type="file" accept="application/pdf" on:change={(e) => (file = e.target.files[0])} />
	<button on:click={uploadFile}>Upload PDF</button>
</div>

<div class="pdf-list">
	<h3>Uploaded PDFs</h3>
	<ul>
		{#each pdfList as pdf}
			<li><a href={pdf.url} target="_blank">{pdf.name}</a></li>
		{/each}
	</ul>
</div>

<style>
	.upload-section {
		margin-bottom: 20px;
	}

	.pdf-list {
		margin-top: 20px;
	}

	.pdf-list ul {
		list-style: none;
		padding: 0;
	}

	.pdf-list li {
		margin-bottom: 10px;
	}

	.pdf-list a {
		text-decoration: none;
		color: blue;
	}
</style>
