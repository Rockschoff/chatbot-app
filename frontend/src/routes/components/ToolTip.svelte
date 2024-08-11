<!-- src/components/ToolTip.svelte -->
<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
	import { faTimes } from '@fortawesome/free-solid-svg-icons';
  
	const dispatch = createEventDispatcher();
  
	function closeToolTip() {
	  dispatch('closeToolTip');
	}
  </script>
  
  <div
	class="fixed inset-0 flex items-center justify-center p-3 bg-gray-800 bg-opacity-50 z-50 animate-fade-in"
  >
	<div
	  class="relative bg-white text-gray-700 p-6 rounded-lg shadow-xl w-full max-w-md lg:max-w-lg transition-all duration-500 ease-in-out transform scale-95 hover:scale-100"
	>
	  <span
		on:click={closeToolTip}
		class="absolute top-2 right-2 cursor-pointer hover:bg-gray-200 p-2 rounded-full transition-colors duration-300"
	  >
		<FontAwesomeIcon icon={faTimes} class="text-black text-xl" />
	  </span>
  
	  <div class="text-lg lg:text-xl font-semibold mb-3 text-gray-800">
		IN-Q COMPLIANCE KNOWLEDGE CENTER
	  </div>
  
	  <p class="mb-2 text-gray-600 leading-relaxed">
		In-Q FDA Knowledge Center can help you with various tasks related to FDA compliance. Here are some of the ways it can assist:
		<br />
		<br />
		<strong class="text-gray-800">Guidance on Regulations</strong>: the tool can help interpret and explain specific FDA regulations and guidelines, citing original documents.<br />
		<strong class="text-gray-800">Document Review</strong>: the tool can review compliance documents or regulatory filings to ensure they meet FDA standards.<br />
		<strong class="text-gray-800">Information Retrieval</strong>: If you need specific information from a large document, the tool can quickly search and find relevant sections.<br />
		<strong class="text-gray-800">Drafting Assistance</strong>: the tool can assist in drafting compliance documents, ensuring they adhere to regulatory requirements.<br />
		<strong class="text-gray-800">Translation into 20 languages</strong>: interaction within this tool can be done in 20 main languages.<br />
		<br />
		To get started, you can ask the tool a specific question, and the tool will use the FDA's compliance framework to provide accurate and relevant answers. If your question falls outside the scope of the documents, it will let you know.<br />
		<br />
	  </p>
  
	  <p class="italic text-gray-500">
		This tool is not a replacement for an expert decision that determines final actions.
	  </p>
	</div>
  </div>
  
  <style lang="postcss">
	@keyframes fade-in {
	  0% {
		opacity: 0;
	  }
	  100% {
		opacity: 1;
	  }
	}
  
	.animate-fade-in {
	  animation: fade-in 0.3s ease-in-out;
	}
  </style>