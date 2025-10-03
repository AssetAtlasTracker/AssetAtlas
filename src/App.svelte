<script lang="ts">
  import "./svelteStyles/main.css";
  import { onMount } from "svelte";
  import { Router, Route } from "svelte-routing";
  import Home from "./sveltePages/Home.svelte";
  import View from "./sveltePages/View.svelte";
  import ViewTemplates from "./sveltePages/ViewTemplates.svelte";
  import Users from "./sveltePages/Users.svelte";
  import { fetchIp } from "./stores/ipStore.js";
  import Utility from "./sveltePages/Utility.svelte";
  import ActionDisplay from "./svelteComponents/ActionDisplay.svelte";

  onMount(async () => {
    localStorage.removeItem('ip'); //clear the old IP, if any
    await fetchIp();
  });
</script>

<!-- we can render actiondisplay here so its persistent -->
<ActionDisplay />

<Router>
  <main>
    <Route path="/" component={Home} />
    <Route path="/view/:id" let:params>
      <View {params} />
    </Route>
    <Route path="/viewTemplates" component={ViewTemplates} />
    <Route path="/users" component={Users} />
    <Route path="/utility" component={Utility} />
  </main>
</Router>
