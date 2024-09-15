import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [sveltekit()],
	optimizeDeps: {
		include: ['pdfjs-dist', 'xlsx', 'papaparse', 'mammoth', "jszip"]
	  },
	server : {
		proxy : {
			"/api" : {
				target: 'https://www.ecfr.gov',
				changeOrigin: true,
				rewrite: (path) => path.replace(/^\/api/, '')
			},
			"/fda-proxy": {
				target: 'https://www.fda.gov',
				changeOrigin: true,
				rewrite: (path) => path.replace(/^\/fda-proxy/, '')
			  },
			// "/local-api" : {
			// 	target : 'http://localhost:3000',
			// 	changeOrigin: true,
			// 	rewrite: (path) => path.replace(/^\/local-api/, '')
			// }
		}
	}
});
