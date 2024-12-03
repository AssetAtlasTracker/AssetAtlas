<script lang="ts">
  import { AppBar } from '@skeletonlabs/skeleton';
  import { onMount } from 'svelte';
  import { ip } from '../stores/ipStore';
  import mongoose from 'mongoose';
  import ItemDetails from '../svelteComponents/ItemDetails.svelte';
  export let params;
  console.log('view params:', params);
  import '../svelteStyles/home.css';
  import '../svelteStyles/main.css';

  let item = {};
  let id = params.id;

  onMount(async () => {
    try {
      if (!$ip) {
        console.error('no ip bruh');
        return;
      }
      console.log('IP:', $ip, 'ID:', params.id);
      const isValid = mongoose.Types.ObjectId.isValid(params.id);
      console.log('Is valid ObjectId:', isValid);
      console.log('Fetching item from:', `http://${$ip}/api/items/${params.id}`);
      const response = await fetch(`http://${$ip}/api/items/${id}`);
      item = await response.json();
    } catch (err) {
      console.error('Error fetching item:', err);
    }
  });
</script>

<AppBar class="appbar-border glass">

</AppBar>

<ItemDetails {item} />

  