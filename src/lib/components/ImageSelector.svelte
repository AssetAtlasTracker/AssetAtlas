<script lang="ts">
	import { createEventDispatcher, onMount } from 'svelte';
	import { CameraIcon } from '@lucide/svelte';
	import { FileUpload } from '@skeletonlabs/skeleton-svelte';

	import type { FileAcceptDetails, FileRejectDetails } from '@skeletonlabs/skeleton';
    import { actionStore } from '$lib/stores/actionStore';

	export let itemId: string | undefined = undefined;
	export let existingImage: boolean = false;

	let imagePreview: string | null = null;
	let selectedImage: File | null = null;
	let removeExistingImage = false;
	let errorMessage: string = '';
	let isUploading: boolean = false;
  
	const maxImageSize = 5 * 1024 * 1024;
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

	function handleImageChange(details: FileAcceptDetails) {
		if (details.files?.length) {
			const file = details.files[0];
			if (file.size > maxImageSize) {
				console.log(`File size exceeds 5MB limit. Selected file is ${(file.size / (1024 * 1024)).toFixed(2)}MB.`);
				return;
			}
			
			selectedImage = file;
			if (selectedImage) {
				imagePreview = URL.createObjectURL(selectedImage);
			}

			removeExistingImage = false;
			dispatch('imageChange', {
				selectedImage,
				removeExistingImage: false
			});
		}
	}

	function handleImageReject(details: FileRejectDetails) {
		if (details.files?.length) {
			const file = details.files[0];
			if (file.errors[0] === "FILE_TOO_LARGE") {
				actionStore.addMessage("File exceeds 5MB size limit!")
			}
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

	<FileUpload onFileAccept={handleImageChange} 
		onFileReject={handleImageReject}
		accept={allowedFileTypes} 
		maxFileSize={maxImageSize}
		>
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
		<!-- <FileUpload.ClearTrigger>Clear Files</FileUpload.ClearTrigger> -->
	</FileUpload>
</div>
