import { login } from '$lib/stores/loginStore.js';

export async function load({ fetch }) {
	const response = await fetch('/api/oauth/profile');
    
	if (response.ok) {
		const userData = await response.json();
		login.set({
			isLoggedIn: true,
			name: userData.name,
			sub_id: userData.sub_id,
			permissionLevel: userData.permissionLevel
		});
	} else {
		login.set({
			isLoggedIn: false,
			permissionLevel: 0,
			name: "guest",
			sub_id: "null"
		});
	}
}