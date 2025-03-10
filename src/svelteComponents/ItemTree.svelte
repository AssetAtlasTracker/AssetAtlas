<script lang="ts">
  import { onMount } from "svelte";
  import { ip } from "../stores/ipStore.js";
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
  export let currentId: string | null = null;

  let treeData: TreeItem[] = [];
  let expanded: Record<string, boolean> = {};
  let loading = true;

  async function fetchTree(id?: string) {
    try {
      const url = id
        ? `http://${$ip}/api/items/tree/${id}`
        : `http://${$ip}/api/items/tree`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch tree data");
      const data = await res.json();
      return Array.isArray(data) ? data : [data];
    } catch (err) {
      console.error("Error fetching tree:", err);
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
    autoExpandTree(treeData);
  }

  function toggleExpand(id: string) {
    expanded[id] = !expanded[id];
    expanded = expanded;
  }

  function autoExpandTree(items: TreeItem[]) {
    if (items.length === 1) {
      const item = items[0];
      if (item.hasChildren && item.children && item.children.length > 0) {
        expanded[item._id] = true;
        autoExpandTree(item.children);
      }
    }
  }

  onMount(() => {
    loadTree();
  });

  $: if (parentId) {
    loadTree();
  }
</script>

<div class="tree-container">
  {#if loading}
    <p>Loading tree...</p>
  {:else}
    {#each treeData as item (item._id)}
      <div class="tree-branch" style="padding-left: {indentLevel * 0.75}rem;">
        <div class="tree-item">
          {#if item.hasChildren}
            <button class="expand-button" on:click={() => toggleExpand(item._id)} aria-label={expanded[item._id] ? "Collapse" : "Expand"}>
              <span class="tree-icon">{expanded[item._id] ? "▾" : "▸"}</span>
            </button>
          {:else}
            <span class="expand-button placeholder-icon"></span>
          {/if}
          
          <Link to={`/view/${item._id}`} style="text-decoration: none;">
            <button 
              class="tree-item-button {item._id === currentId ? 'current' : ''}" 
              aria-current={item._id === currentId}
            >
              {item.name}
            </button>
          </Link>
        </div>

        {#if expanded[item._id] && item.children}
          <svelte:self
            rootData={item.children}
            indentLevel={indentLevel + 1}
            {currentId}
          />
        {/if}
      </div>
    {/each}
  {/if}
</div>
