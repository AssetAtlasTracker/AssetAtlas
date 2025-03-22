<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte';

  export let itemId: string | undefined = undefined;
  export let existingImage: boolean = false;

  let imagePreview: string | null = null;
  let selectedImage: File | null = null;
  let removeExistingImage = false;
  
  const dispatch = createEventDispatcher();

  onMount(async () => {
    if (itemId && existingImage) {
      await checkImageExists();
    }
  });

  async function checkImageExists() {
    if (!itemId) return;
    
    try {
      const response = await fetch(`/api/items/${itemId}/image`);
      if (response.ok) {
        imagePreview = `/api/items/${itemId}/image?t=${Date.now()}`;
        removeExistingImage = false;
        dispatch('imageChange', { 
          selectedImage: null,
          removeExistingImage: false
        });
      } else {
        resetImage();
      }
    } catch (err) {
      console.error("Error checking image:", err);
      resetImage();
    }
  }

  function handleImageChange(e: Event) {
    const input = e.currentTarget as HTMLInputElement;
    if (input?.files?.length) {
      selectedImage = input.files[0];
      imagePreview = URL.createObjectURL(selectedImage);
      removeExistingImage = false;
      dispatch('imageChange', {
        selectedImage,
        removeExistingImage: false
      });
    }
  }

  function resetImage() {
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }
    selectedImage = null;
    imagePreview = null;
    removeExistingImage = true;
    dispatch('imageChange', {
      selectedImage: null,
      removeExistingImage: true
    });
  }
</script>

<div class="flex flex-col space-y-2">
  <label class="min-w-[400px]">
    Image:
    <div class="image-upload-container">
      <input
        type="file"
        accept="image/*"
        on:change={handleImageChange}
        class="dark-textarea"
      />
    </div>
  </label>
  
  {#if imagePreview}
    <div class="relative w-48 h-48">
      <img
        src={imagePreview}
        alt="Preview"
        class="object-cover w-full h-full"
      />
      <button
        type="button"
        class="absolute top-0 right-0 bg-red-500 text-white p-1"
        on:click={resetImage}
      >
        X
      </button>
    </div>
  {/if}
</div>
