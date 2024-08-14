<script>
    import { onMount } from "svelte";
  
    let textOptions = [
      "Analyzing the Question",
      "Collecting documents",
      "Analyzing CFR",
      "Collecting relevant FDA docs",
      "Analyzing"
    ];
    
    let currentText = textOptions[0];
    let fadeIn = true;
  
    // Function to change the text
    onMount(() => {
      let index = 0;
      setInterval(() => {
        fadeIn = false;
        setTimeout(() => {
          index = (index + 1) % textOptions.length;
          currentText = textOptions[index];
          fadeIn = true;
        }, 500); // Wait for fade-out before changing text
      }, 1500); // Change text every 2.5 seconds
    });
  </script>
  
  <div class="flex justify-center items-center">
    <p
      class={`transition-opacity duration-500 ease-in-out ${fadeIn ? 'opacity-100' : 'opacity-0'}`}
    >
      {currentText}...
    </p>
  </div>
  