<script lang="ts">
  import "./svelteStyles/main.css";
  import { onMount } from "svelte";
  import { Router, Route } from "svelte-routing";
  import Home from "./sveltePages/Home.svelte";
  import View from "./sveltePages/View.svelte";
  import ViewTemplates from "./sveltePages/ViewTemplates.svelte";
  import { fetchIp } from "./stores/ipStore";
  import ActionDisplay from "./svelteComponents/ActionDisplay.svelte";

  onMount(() => {
    fetchIp();
  });
</script>

<ActionDisplay />

<Router>
  <main>
    <Route path="/" component={Home} />
    <Route path="/view/:id" let:params>
      <View {params} />
    </Route>
    <Route path="/viewTemplates" component={ViewTemplates} />
  </main>
</Router>
