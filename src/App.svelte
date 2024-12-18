<script lang="ts">
  import { onMount } from 'svelte';
  //import { Router, Route } from 'svelte-routing';
  //import Home from './sveltePages/Home.svelte';
  //import View from './sveltePages/View.svelte';
  //import { fetchIp } from './stores/ipStore';

  let ipFetched = false;

  onMount(async () => {
    //await fetchIp();
    ipFetched = true;
  });
</script>

{#if ipFetched}
  <!-- <Router>
    <Route path="/" component={Home} />
    <Route path="/view/:id" let:params>
      <View {params} />
    </Route>
  </Router> -->
  <p>fetched...</p>
{:else}
  <p>Loading...</p>
{/if}
