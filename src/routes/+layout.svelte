<script>
    import { AppBar } from '@skeletonlabs/skeleton';
    import '../app.css';
  </script>
  
  <AppBar class="border-gray-400 shadow" background="bg-white">
    <svelte:fragment slot="lead">(actions)</svelte:fragment>
    <div class="flex px-4 grid grid-cols-4">
      <div class="text-2xl font-bold">Asset Atlas</div>
      <div class="flex-auto pb-4">
        <slot name="searchbar" />
      </div>
    </div>
    <svelte:fragment slot="trail">(profile icon)</svelte:fragment>
  </AppBar>
  
  <main class="body">
    <slot />
  </main>
  
  <style>
    main.body {
      padding: 1.5rem;
    }
  
    .page-component {
      margin: 1.5rem;
      padding: 1.5rem;
      box-shadow: 5px 5px 8px -8px slategray;
    }
  
    .internal-component {
      margin: 1rem 0;
      padding: 1rem;
      background-color: #E4E6EE;
      box-shadow: inset 5px 5px 8px -8px slategray;
    }
  
    .add-btn {
      padding: 1rem 1.25rem 1.55rem;
      position: absolute;
      bottom: 4rem;
      right: 4rem;
    }
  </style>