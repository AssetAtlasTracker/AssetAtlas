<script>
  import { Router, Route, Link } from 'svelte-routing';
  import Home from './sveltePages/Home.svelte';
</script>


<Router>
  <!-- <nav>
    <Link to="/">Home</Link>
  </nav>  -->
  <Route path="/" component={Home} />
</Router>
