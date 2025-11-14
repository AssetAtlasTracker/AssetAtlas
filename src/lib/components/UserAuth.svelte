<script lang="ts">
	import { createEventDispatcher, onMount } from "svelte";
	import { user, type UserState } from "$lib/stores/userStore.js";
  
	const dispatch = createEventDispatcher();
  
	export let dialog: HTMLDialogElement;

	async function sha256(message: string) {
		const msgBuffer = new TextEncoder().encode(message);
		const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
		const hashArray = Array.from(new Uint8Array(hashBuffer));
		const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
		return hashHex;
	}
  
	let username = "";
	let password = "";
	let isRegistering = false;
	let errorMessage = "";
	let successMessage = "";
  
	function handleClose() {
		username = "";
		password = "";
		errorMessage = "";
		successMessage = "";
		dispatch("close");
	}
  
	async function handleSubmit() {
		if (!username || !password) {
			errorMessage = "Username and password are required";
			return;
		}
    
		errorMessage = "";
		successMessage = "";
    
		try {
			const endpoint = isRegistering ? '/api/auth/register' : '/api/auth/login';
      
			// Hash the password before sending to server, if user is re-using password at least that will not leak
			const hashedPassword = sha256(password).toString();
      
			const response = await fetch(endpoint, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ 
					username, 
					password: hashedPassword
				}),
			});
      
			const data = await response.json();
      
			if (!response.ok) {
				throw new Error(data.message || 'Authentication failed');
			}
      
			// Store token in localStorage
			localStorage.setItem('token', data.token);
      
			// Update user store
			user.set({
				isLoggedIn: true,
				username: data.user.username,
				permissionLevel: data.user.permissionLevel,
				id: data.user.id
			});
      
			handleClose();
			dialog.close();
      
		} catch (err) {
			errorMessage = err instanceof Error ? err.message : 'Something went wrong';
			console.error('Auth error:', err);
		}
	}
  
	function setMode(mode: boolean) {
		isRegistering = mode;
		errorMessage = "";
		successMessage = "";
	}
  
	async function handleLogout() {
		// Clear token and user state
		localStorage.removeItem('token');
		user.set({ isLoggedIn: false, username: '', permissionLevel: 0, id: '' });
    
		handleClose();
		dialog.close();
	}
  
	// Check if user is already logged in
	onMount(() => {
		const token = localStorage.getItem('token');
		if (token) {
			// Fetch user profile to validate token
			fetch('/api/auth/profile', {
				headers: {
					'Authorization': `Bearer ${token}`
				}
			})
				.then(res => {
					if (res.ok) return res.json();
					throw new Error('Invalid token');
				})
				.then(userData => {
					user.set({
						isLoggedIn: true,
						username: userData.username,
						permissionLevel: userData.permissionLevel,
						id: userData.id
					});
				})
				.catch(() => {
					localStorage.removeItem('token');
				});
		}
	});
  
	let currentUser: UserState | undefined;
	user.subscribe(value => {
		currentUser = value;
	});
</script>

<dialog bind:this={dialog} class="glass border">
	<div class="flex flex-col space-y-4 p-4 relative">
		<button class="x-button absolute top-0 right-0 mt-2 mr-2" on:click={() => dialog.close()}>X</button>
    
		{#if currentUser?.isLoggedIn}
			<div>
				<h2 class="important-text text-center mb-4">You are: {currentUser.username}</h2>
				<p class="text-center mb-4">Permission Level: {currentUser.permissionLevel}</p>
        
				<button class="border-button w-full" on:click={handleLogout}>
					Log Out
				</button>
			</div>
		{:else}
			<div>
				<h2 class="important-text text-center mb-4">
					{isRegistering ? 'Create Account' : 'Log In'}
				</h2>
        
				<div class="flex w-full mb-4 gap-2">
					<button 
						class={!isRegistering ? "inactive-button w-full" : "border-button w-full"}
						on:click={() => setMode(false)}
					>
						Log In
					</button>
					<button 
						class={isRegistering ? "inactive-button w-full" : "border-button w-full"}
						on:click={() => setMode(true)}
					>
						Register
					</button>
				</div>
        
				{#if errorMessage}
					<div class="error-message text-center mb-4">{errorMessage}</div>
				{/if}
        
				<form on:submit|preventDefault={handleSubmit}>
					<div class="mb-4">
						<label class="block mb-2">
							Username
							<input 
								type="text" 
								bind:value={username} 
								class="dark-textarea py-2 px-4 w-full mt-1"
								placeholder="Enter username"
							/>
						</label>
					</div>
          
					<div class="mb-4">
						<label class="block mb-2">
							Password
							<input 
								type="password" 
								bind:value={password} 
								class="dark-textarea py-2 px-4 w-full mt-1"
								placeholder="Enter password"
							/>
						</label>
					</div>
          
					<button type="submit" class="success-button w-full">
						{isRegistering ? 'Create Account' : 'Sign In'}
					</button>
				</form>
			</div>
		{/if}
	</div>
</dialog>
