<script lang="ts">
  import "./svelteStyles/main.css";
  import { onMount } from "svelte";
  import { Router, Route } from "svelte-routing";
  import Home from "./sveltePages/Home.svelte";
  import View from "./sveltePages/View.svelte";
  import ViewTemplates from "./sveltePages/ViewTemplates.svelte";
  import { fetchIp } from "./stores/ipStore.js";
  import Utility from "./sveltePages/Utility.svelte";

  onMount(async () => {
    localStorage.removeItem('ip'); //clear the old IP, if any
    await fetchIp();
  });
</script>

<Router>
  <main>
    <Route path="/" component={Home} />
    <Route path="/view/:id" let:params>
      <View {params} />
    </Route>
    <Route path="/viewTemplates" component={ViewTemplates} />
  </main>
  <Route path="/utility" component={Utility} />
</Router>
