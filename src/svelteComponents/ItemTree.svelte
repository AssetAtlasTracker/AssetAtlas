<script lang="ts">
  import { onMount } from 'svelte';
  import { ip } from '../stores/ipStore';
  import { Link } from "svelte-routing";

  interface TreeItem {
    _id: string;
    name: string;
    description?: string;
    children: TreeItem[];
    hasChildren: boolean;
  }

  export let parentId: string | null = null;
  export let indentLevel: number = 0;
  export let rootData: TreeItem[] | null = null;

  let treeData: TreeItem[] = [];
  let expanded: Record<string, boolean> = {};
  let loading = true;

  async function fetchTree(id?: string) {
    try {
      const url = id ? `http://${$ip}/api/items/tree/${id}` : `http://${$ip}/api/items/tree`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch tree data');
      const data = await res.json();
      return Array.isArray(data) ? data : [data];
    } catch (err) {
      console.error('Error fetching tree:', err);
      return [];
    }
  }

  async function loadTree() {
    loading = true;
    if (rootData) {
      treeData = rootData;
    } else {
      treeData = await fetchTree(parentId || undefined);
    }
    loading = false;
  }

  function toggleExpand(id: string) {
    expanded[id] = !expanded[id];
    expanded = expanded;
  }

  onMount(() => {
    loadTree();
  });
</script>

<div class="tree-container">
  {#if loading}
    <p>Loading tree...</p>
  {:else}
    {#each treeData as item (item._id)}
      <!--TODO: Change to not use "style="-->
      <div class="tree-item" style="margin-left: {indentLevel}rem;">
        <button class="expand-button" on:click={() => toggleExpand(item._id)}>
          {#if item.hasChildren}
            {expanded[item._id] ? '▼' : '▶'}
          {:else}
            <span class="no-children">•</span>
          {/if}
        </button>
        <Link to={`/view/${item._id}`}>
          <span class="tree-item-name">{item.name}</span>
        </Link>
      </div>

      {#if expanded[item._id] && item.children}
        <svelte:self rootData={item.children} indentLevel={indentLevel + 1} />
      {/if}
    {/each}
  {/if}
</div>