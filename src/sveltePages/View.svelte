<script lang="ts">
    import { AppBar } from '@skeletonlabs/skeleton';
  
    import '../svelteStyles/home.css';
    import '../svelteStyles/main.css';

    // Form inputs
    let name = '';
    let description = '';
    let tags = '';
    let containedItems = '';

  </script>
  
  <AppBar class="appbar-border glass">
    <svelte:fragment slot="lead">
      (actions)
    </svelte:fragment>
    <div class="px-4">
      <a href="/">
      <div id="title" class="nav-margin text-2xl font-bold">
        Asset Atlas
      </div>
    </a>
    </div>
    <svelte:fragment slot="trail">
      (profile icon)
    </svelte:fragment>
  </AppBar>

  