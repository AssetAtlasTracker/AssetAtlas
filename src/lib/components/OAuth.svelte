 <script lang="ts">
  import { createEventDispatcher, onMount } from "svelte";
  import { login, type LoginState } from "../stores/loginStore.js";

  const dispatch = createEventDispatcher();
  
  export let dialog: HTMLDialogElement;
  let oauthResult = "";
  let showAuthenticatorLogin = false;
  let username = "";
  let qrCode = "";
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
      const response = await fetch('/api/oauth/loginGoogle');
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'OAuth failed');
      }
      
      window.open(data.url, "_blank", "noopener,noreferrer");
      
    } catch (err) {
      oauthResult = err instanceof Error ? err.message : 'Something went wrong';
      console.error('OAuth error:', err);
    }
  }


  async function handleAuthenticatorApp() {
    showAuthenticatorLogin = true;
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
      
      qrCode = data.qrCode;
      otpCode = data.otpCode;
    } catch (err) {
      oauthResult = err instanceof Error ? err.message : 'Something went wrong';
      console.error('QR code error:', err);
    }
  }

  async function verifyAuthCode() {
    // TODO: Implement verification endpoint
    console.log('Verifying code:', authCode, 'for user:', username);
  }

  function backToMain() {
    showAuthenticatorLogin = false;
    username = "";
    qrCode = "";
    authCode = "";
    oauthResult = "";
    otpCode = "";
  }

  async function handleLoginGithub() {
    try {
      const response = await fetch('/api/oauth/loginGithub');
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'OAuth failed');
      }
      
      window.open(data.url, "_blank", "noopener,noreferrer");
      
    } catch (err) {
      oauthResult = err instanceof Error ? err.message : 'Something went wrong';
      console.error('OAuth error:', err);
    }
  }

  async function handleLogout() {
    try {
      const response = await fetch('/api/oauth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'OAuth failed');
      }

      login.set({
        isLoggedIn: false,
        name: "",
        sub_id: "",
        permissionLevel: 0
      });

      oauthResult = "Successfully logged out.";

    } catch (err) {
      oauthResult = err instanceof Error ? err.message : 'Something went wrong';
      console.error('Logout error:', err);
    }
  }



  
  let currentLogin: LoginState | undefined;
	login.subscribe((value) => {
		currentLogin = value;
	});

 

    
</script>


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
        {#if qrCode}
          <div class="text-center mb-4">
            <img src={qrCode} alt="Authenticator QR Code" class="mx-auto mb-4" />
            <div class="border p-2 w-full mb-4">One-Time Code: {otpCode} </div>
            <input type="text" placeholder="Enter code from app" bind:value={authCode} class="border p-2 w-full mb-4" />
            <button class="border-button w-full" on:click={verifyAuthCode}>
              Verify Code
            </button>
          </div>
        {:else}
          <input type="text" placeholder="Enter your username" bind:value={username} class="border p-2 w-full mb-4" />
          <button class="border-button w-full" on:click={fetchQRCode}>
            Generate QR Code
          </button>
        {/if}
        <button class="border-button w-full mt-4" on:click={backToMain}>
          Back
        </button>
      </div>
    {/if}
  </div>
</dialog>
  