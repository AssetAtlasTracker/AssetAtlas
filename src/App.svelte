<script lang="ts">
  import { onMount } from 'svelte';
  import { Router, Route, Link } from 'svelte-routing';
  import Home from './sveltePages/Home.svelte';
  import View from './sveltePages/View.svelte';
  import Utility from './sveltePages/Utility.svelte';
  import { fetchIp } from './stores/ipStore';

  onMount(() => {
    fetchIp();
  });
</script>


<Router>
  <!-- <nav>
    <Link to="/">Home</Link>
  </nav>  -->
  <Route path="/" component={Home} />
  <!-- <Route path="/view/:id" component={View} /> -->
  <Route path="/view/:id" let:params>
    <View {params} />
    </Route>

  <Route path="/utility">
    <Utility/>
  </Route>
</Router>
