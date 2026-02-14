<script lang="ts">
    import { actionStore } from '$lib/stores/actionStore.js';
	import toast, { Toaster } from 'svelte-french-toast';

    function showToast(message: string) {
        toast(message, {
            duration: 3000,
            position: 'bottom-center',
            style: 'background-color: rgba(0, 0, 0, 0.8); color: white; padding: 1rem; border-radius: 0.5rem; z-index: 20000;'
        });
    }

    // Track previous message count to detect new messages
    let previousLength = 0;
    
    $: {
        if ($actionStore.length > previousLength) {
            // New message added, show the latest one
            const latestMessage = $actionStore[$actionStore.length - 1];
            showToast(latestMessage.text);
        }
        previousLength = $actionStore.length;
    }
</script>

<Toaster />

