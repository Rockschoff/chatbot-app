import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [sveltekit()],
	optimizeDeps: {
		include: ['pdfjs-dist', 'xlsx', 'papaparse', 'mammoth', "jszip"]
	  },
	server:{
		port : 7000
	}
});
