<script lang="ts">
	import { createEventDispatcher, onMount } from "svelte";
	import { login, type LoginState } from "../stores/loginStore.js";

	const dispatch = createEventDispatcher();

	export let dialog: HTMLDialogElement;
	let oauthResult = "";
	let showAuthenticatorLogin = false;
	let username = "";
	let qrCode = "";
	let transitionToOTP = false;
	let authCode = "";
	let otpCode = "";

	let errorMessage = "";
	let successMessage = "";

	function handleClose() {
		errorMessage = "";
		successMessage = "";
		dispatch("close");
	}

	async function handleLoginGoogle() {
		try {
			const response = await fetch("/api/oauth/loginGoogle");

			const data = await response.json();

			if (!response.ok) {
				throw new Error(data.message || "OAuth failed");
			}
      
			openOAuthWindow(data.url);
      
		} catch (err) {
			oauthResult = err instanceof Error ? err.message : 'Something went wrong';
			console.error('OAuth error:', err);
		}
	}


	async function handleAuthenticatorApp() {
		showAuthenticatorLogin = true;
	} 

	async function checkForAccount(){
		try {
			const response = await fetch(`/api/authenticator/checkAccount?username=${encodeURIComponent(username)}`);
			const data = await response.json();
      
			if (!response.ok) {
				throw new Error(data.message || 'Account check failed');
			}
      
			return data.exists;
		} catch (err) {
			oauthResult = err instanceof Error ? err.message : 'Something went wrong';
			console.error('Account check error:', err);
			return false;
		}

	}

	async function fetchQRCode() {
		try {
			const response = await fetch('/api/authenticator/check', {
				method: 'POST',
				body: JSON.stringify({ username }),
				headers: {
					'Content-Type': 'application/json'
				}
			})
			const data = await response.json();
      
			if (!response.ok) {
				throw new Error(data.message || 'Failed to generate QR code');
			}

			if(!data.qrCode){
				oauthResult = "Existing account found, please enter code from app";
				console.log("did the alt path");
				qrCode = "";
			} else {
				qrCode = data.qrCode;
			}
			otpCode = data.otpCode;
			transitionToOTP = true;
		} catch (err) {
			oauthResult = err instanceof Error ? err.message : 'Something went wrong';
			console.error('QR code error:', err);
		}
	}

	async function verifyAuthCode() {
		const response = await fetch(`/api/authenticator/verify?username=${encodeURIComponent(username)}&code=${encodeURIComponent(authCode)}`);
		const data = await response.json();
    
		if (!response.ok) {
			oauthResult = data.message || 'Verification failed';
			return;
		} else {
			oauthResult = "";
			window.location.href = data.redirect;
		}
	}

	function backToMain() {
		oauthResult = "";
		showAuthenticatorLogin = false;
		username = "";
		qrCode = "";
		transitionToOTP = false;
		authCode = "";
		otpCode = "";
	}

	async function handleLoginGithub() {
		try {
			const response = await fetch("/api/oauth/loginGithub");

			const data = await response.json();

			if (!response.ok) {
				throw new Error(data.message || "OAuth failed");
			}
      
			openOAuthWindow(data.url);
      
		} catch (err) {
			oauthResult =
				err instanceof Error ? err.message : "Something went wrong";
			console.error("OAuth error:", err);
		}
	}

	async function handleLogout() {
		try {
			const response = await fetch("/api/oauth/logout", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
			});

			const data = await response.json();

			if (!response.ok) {
				throw new Error(data.message || "OAuth failed");
			}

			login.set({
				isLoggedIn: false,
				name: "",
				sub_id: "",
				permissionLevel: 0,
			});

			oauthResult = "Successfully logged out.";
		} catch (err) {
			oauthResult =
				err instanceof Error ? err.message : "Something went wrong";
			console.error("Logout error:", err);
		}
	}

	function openOAuthWindow(url: string) {
		const width = 600;
		const height = 700;
		const left = window.screenX + (window.outerWidth - width) / 2;
		const top = window.screenY + (window.outerHeight - height) / 2;
		
		window.open(
			url,
			'oauth',
			`width=${width},height=${height},left=${left},top=${top}`
		);
	}



  
	let currentLogin: LoginState | undefined;
	login.subscribe((value) => {
		currentLogin = value;
	});
 
	onMount(() => {
		window.addEventListener('message', (event) => {
			if (event.origin !== window.location.origin) return;
			
			if (event.data.type === 'oauth_success') {
				window.location.reload();
			}
		});
	});
</script>

				{#if oauthResult}
					<div class="text-center mb-4">{oauthResult}</div>
				{/if}

<dialog bind:this={dialog} class="glass border fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
	<div class="flex flex-col space-y-4 p-4 relative">
		<button class="x-button absolute top-0 right-0 mt-2 mr-2" on:click={() => dialog.close()}>X</button>
    
		{#if !showAuthenticatorLogin}
			<div>
				<h2 class="important-text text-center mb-4">Login with external account</h2>
      
				{#if oauthResult}
					<div class="text-center mb-4">{oauthResult}</div>
				{/if}
      
				<button class="border-button w-full" on:click={handleLoginGoogle}>
					Login with Google Account
				</button>

				<button class="border-button w-full" on:click={handleLoginGithub}>
					Login with Github Account
				</button>

				<button class="border-button w-full" on:click={handleAuthenticatorApp}>
					Login with Authenticator App
				</button>

				<button class="border-button w-full" on:click={handleLogout}>
					Logout
				</button>
      
			</div>
		{:else}
			<div>
				<h2 class="important-text text-center mb-4">Login with Authenticator App</h2>
				{#if transitionToOTP}
					<div class="text-center mb-4">
						{#if qrCode}
							<img src={qrCode} alt="Authenticator QR Code" class="mx-auto mb-4" />
							<div class="border p-2 w-full mb-4">One-Time Code: {otpCode} </div>
						{/if}
						{#if oauthResult}
							<div class="text-center mb-4 text-red-500">{oauthResult}</div>
						{/if}
						<input type="text" placeholder="Enter code from app" bind:value={authCode} class="border p-2 w-full mb-4" />
						<button class="border-button w-full" on:click={verifyAuthCode}>
							Verify Code
						</button>
					</div>
				{:else}
					<input type="text" placeholder="Enter your username" bind:value={username} class="border p-2 w-full mb-4" />
					<button class="border-button w-full" on:click={fetchQRCode}>
						Login to account
					</button>
				{/if}
				<button class="border-button w-full mt-4" on:click={backToMain}>
					Back
				</button>
			</div>
		{/if}
	</div>
</dialog>
