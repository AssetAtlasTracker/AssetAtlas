<script lang="ts">
    import { AppBar } from '@skeletonlabs/skeleton';
    import SearchBar from '../svelteComponents/SearchBar.svelte';
    import { Link, navigate } from 'svelte-routing';
    import { Menu } from 'lucide-svelte';

    export let searchQuery: string = '';
    export let onSearch: (query: string) => void = navHome;
    function navHome() {
        // navigate("/");
    }
</script>

<AppBar class="appbar-border glass">
  <div class="px-4">
    <div class="nav-margin float-left">
      <Menu/>
    </div>
    <div class="float-left">
      <Link to={'/'}>
        <div id="title" class="nav-margin text-2xl font-bold">
          Asset Atlas
        </div>
      </Link>
      <div class="nav-margin flex-auto pb-4">
        <SearchBar searchQuery={searchQuery} onSearch={onSearch} />
      </div>
    </div>
  </div>
</AppBar>
