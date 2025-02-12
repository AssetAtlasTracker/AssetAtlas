<script lang="ts">
  import { Link } from "svelte-routing";
  import { ip } from "../stores/ipStore.js";
  import { onMount, onDestroy } from "svelte";
  import type { IBasicItemPopulated } from "../models/basicItem.js";
  import EditItem from "../svelteComponents/EditItem.svelte";
  import Dialog from "../svelteComponents/Dialog.svelte";

  interface ItemUpdateEvent extends CustomEvent {
    detail: {
      imageChanged: boolean;
      [key: string]: any;
    };
  }

  export let item: IBasicItemPopulated;
  let parentChain: { _id: string; name: string }[] = [];

  async function loadParentChain() {
    parentChain = [];
    try {
      const response = await fetch(
        `http://${$ip}/api/items/parentChain/${item._id}`,
      );
      if (response.ok) {
        parentChain = await response.json();
      } else {
        console.error("Failed to fetch parent chain:", await response.text());
      }
    } catch (error) {
      console.error("Error fetching parent chain:", error);
    }
  }

  onMount(loadParentChain);
  $: if (item._id) {
    loadParentChain();
  }

  let isImageExpanded = false;

  function toggleImage() {
    isImageExpanded = !isImageExpanded;
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      toggleImage();
    }
  }

  async function reloadImage() {
    if (item.image) {
      try {
        const response = await fetch(
          `http://${$ip}/api/items/${item._id}/image`,
        );
        if (response.ok) {
          const imgElement = document.querySelector(
            ".item-image",
          ) as HTMLImageElement;
          if (imgElement) {
            imgElement.src = `http://${$ip}/api/items/${item._id}/image?t=${Date.now()}`;
          }
        }
      } catch (error) {
        console.error("Error reloading image:", error);
      }
    }
  }

  //Handle updates from EditItem
  function handleItemUpdated(event: ItemUpdateEvent) {
    if (event.detail.imageChanged) {
      setTimeout(reloadImage, 500);
    }
  }

  //Add event listener on mount and clean up on destroy
  onMount(() => {
    window.addEventListener("itemUpdated", handleItemUpdated as EventListener);
  });

  onDestroy(() => {
    window.removeEventListener(
      "itemUpdated",
      handleItemUpdated as EventListener,
    );
  });

  $: if (item._id) {
    reloadImage();
  }

  let showEditDialog = false;
  let editDialog: HTMLDialogElement | undefined;

  function openEditDialog() {
    console.log("Opening edit dialog");
    showEditDialog = true;
  }
</script>

<div class="item-chain">
  {#if parentChain.length > 0}
    <span>Item Chain: </span>
    {#each parentChain as parent, index}
      {#if index < parentChain.length - 1}
        <!-- Render clickable links for all but the last item -->
        <span class="clickable-text">
          <Link to={`/view/${parent._id}`}>{parent.name}</Link>
        </span>
        <span class="separator"> &gt; </span>
      {:else}
        <!-- Render the last item as bold and non-clickable -->
        <span class="current-item">{parent.name}</span>
      {/if}
    {/each}
  {:else}
    <p>Loading item chain...</p>
  {/if}
</div>

{#if item}
  <h1 id="underline-header" class="font-bold item-name">
    {item.name}
  </h1>

  <button on:click={openEditDialog}>Edit</button>

  {#if item.image}
    <button
      type="button"
      class="item-image-container"
      class:expanded={isImageExpanded}
      on:click={toggleImage}
      on:keydown={handleKeydown}
      aria-label="Toggle image size"
    >
      <img
        src={`http://${$ip}/api/items/${item._id}/image`}
        alt={item.name}
        class="item-image"
      />
    </button>
  {/if}

  {#if item.template}
    <p><strong>Template Name:</strong> {item.template.name}</p>
  {/if}
  <ul>
    {#if item.description}
      <li><strong>Description:</strong> {item.description}</li>
    {/if}

    {#if item.tags && item.tags.length > 0}
      <li><strong>Tags:</strong> {item.tags.join(", ")}</li>
    {/if}

    {#if item.parentItem}
      <li>
        <strong>Current Location:</strong>
        <span class="clickable-text">
          <Link to={`/view/${item.parentItem._id}`}>{item.parentItem.name}</Link
          >
        </span>
      </li>
    {:else}
      <li><strong>Current Location:</strong> No parent</li>
    {/if}

    {#if item.homeItem}
      <li>
        <strong>Home Location:</strong>
        <span class="clickable-text">
          <Link to={`/view/${item.homeItem._id}`}>{item.homeItem.name}</Link>
        </span>
      </li>
    {:else}
      <li><strong>Home Location:</strong> No home</li>
    {/if}

    {#if item.containedItems && item.containedItems.length > 0}
      <li>
        <strong>Contained Items:</strong>
        <ul>
          {#each item.containedItems as containedItem}
            <li>
              <span class="clickable-text">
                <Link to={`/view/${containedItem._id}`}
                  >{containedItem.name}</Link
                >
              </span>
            </li>
          {/each}
        </ul>
      </li>
    {/if}

    {#if item.customFields && item.customFields.length > 0}
      <li>
        <strong>Custom Fields:</strong>
        <ul>
          {#each item.customFields as customField}
            <li>
              {customField.field.fieldName}: {customField.value}
            </li>
          {/each}
        </ul>
      </li>
    {/if}

    {#if item.itemHistory && item.itemHistory.length > 0}
      <li>
        <strong>History Entries:</strong>
        <ul>
          {#each item.itemHistory as history}
            <li>
              {#if history.location}
                <strong> Location:</strong>
                <span class="clickable-text">
                  <Link to={`/view/${history.location._id}`}
                    >{history.location.name}</Link
                  >
                </span>
              {:else}
                <strong> Location:</strong> None
              {/if}
              <strong>Timestamp:</strong>
              {new Date(history.timestamp).toLocaleString()}
            </li>
          {/each}
        </ul>
      </li>
    {/if}

    <li>
      <strong>Created At:</strong>
      {new Date(item.createdAt).toLocaleString()}
    </li>
    <li>
      <strong>Updated At:</strong>
      {new Date(item.updatedAt).toLocaleString()}
    </li>
  </ul>
{:else}
  <p>Loading item data...</p>
{/if}

{#if showEditDialog}
  <EditItem
    {item}
    on:close={() => {
      showEditDialog = false;
      location.reload();
    }}
  />
{/if}
