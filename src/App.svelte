<!-- to be our page that we go to and stuff -->
<script lang="ts">
    let inputValue: string = '';
  
    function handleClick() {
      console.log('Input Value:', inputValue);
    }
  </script>

<main>
    <h1>Simple Input and Button Example</h1>
  
    <!-- Text Input Field -->
    <input bind:value={inputValue} placeholder="Enter something..." />
  
    <!-- Button that triggers handleClick() when clicked -->
    <button on:click={handleClick}>Submit</button>
  </main>

  <style>
    main {
      padding: 2rem;
      font-family: Arial, sans-serif;
    }
  
    input {
      padding: 0.5rem;
      font-size: 1rem;
      margin-right: 1rem;
    }
  
    button {
      padding: 0.5rem 1rem;
      font-size: 1rem;
      cursor: pointer;
    }
  </style>