import { browser } from '$app/environment';
import { login } from '$lib/stores/loginStore.js';
import type { LayoutLoad } from './$types';

export const ssr = false;

export const load: LayoutLoad = async ({ data }) => {
	if (browser) {
		const user = data.user;
		if (user) {
			login.set({
				isLoggedIn: true,
				name: user.name,
				sub_id: user.sub_id,
				permissionLevel: user.permissionLevel
			});
		} else {
			login.set({
				isLoggedIn: false,
				permissionLevel: 0,
				name: 'guest',
				sub_id: 'null'
			});
		}
	}

	return data;
};
