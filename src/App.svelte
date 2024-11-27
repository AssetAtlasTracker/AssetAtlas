<script>
  import { Router, Route, Link } from 'svelte-routing';
  import Home from './sveltePages/Home.svelte';
  import View from './sveltePages/View.svelte';
</script>


<Router>
  <!-- <nav>
    <Link to="/">Home</Link>
  </nav>  -->
  <Route path="/" component={Home} />
  <Route path="/View" component={View} />
</Router>
