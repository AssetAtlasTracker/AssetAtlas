<script lang="ts">
	import { CameraIcon } from '@lucide/svelte';
	import { FileUpload } from '@skeletonlabs/skeleton-svelte';
	import { createEventDispatcher, onMount } from 'svelte';

	import { actionStore } from '$lib/stores/actionStore';
	import type { FileRejectDetails, FileUploadDetails } from '@skeletonlabs/skeleton';

	export let itemId: string | undefined = undefined;
	export let existingImage: boolean = false;

	let imagePreview: string | null = null;
	let selectedImage: File | null = null;
  
	const MAX_IMAGE_SIZE = 50 * 1024 * 1024; // 50MB in bytes
	const allowedFileTypes = ['.jpg', '.jpeg', '.jfif', '.pjpeg', '.pjp', '.png', '.gif'];
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
				const blob = await response.blob();
				const filename = `image-${itemId}.jpg`;
				const file = new File([blob], filename, { type: 'image/jpeg' });
				
				selectedImage = file;
				imagePreview = URL.createObjectURL(blob);
				
				dispatch('imageChange', { 
					selectedImage: file,
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

	function handleImageChange(details: FileUploadDetails) {
		if (details.files?.length) {
			const file = details.files[0];
			
			selectedImage = file;
			if (selectedImage) {
				imagePreview = URL.createObjectURL(selectedImage);
			}

			dispatch('imageChange', {
				selectedImage,
				removeExistingImage: false
			});
		}
	}

	function handleImageReject(details: FileRejectDetails) {
		if (details.files?.length) {
			if (details.files[0].errors[0] === "FILE_TOO_LARGE") {
				actionStore.addMessage("File exceeds max size. Must be <50MB");
			}
		}
	}

	export function resetImage() {
		if (imagePreview) {
			URL.revokeObjectURL(imagePreview);
		}
		selectedImage = null;
		imagePreview = null
		dispatch('imageChange', {
			selectedImage: null,
			removeExistingImage: true
		});
	}
</script>

<div class="flex flex-col space-y-2">

	<FileUpload onFileAccept={handleImageChange} onFileReject={handleImageReject} maxFileSize={MAX_IMAGE_SIZE} accept={allowedFileTypes}>
		<FileUpload.Dropzone>
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
			{:else}
				<CameraIcon class="size-32" />
			{/if}
			<FileUpload.Trigger>Upload Image</FileUpload.Trigger>
			<FileUpload.HiddenInput />
		</FileUpload.Dropzone>
	</FileUpload>
</div>
