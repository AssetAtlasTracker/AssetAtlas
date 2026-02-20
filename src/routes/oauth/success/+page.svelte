<script>
	import { onMount } from 'svelte';
    
	onMount(() => {
		if (window.opener) {
			window.opener.postMessage({ type: 'oauth_success' }, '*');
			window.close();
		}
	});
</script>

<p>Login successful! This window will close automatically...</p>
