import { get, writable } from 'svelte/store';

export interface LoginState {
  isLoggedIn: boolean;
  name: string;
  sub_id: string;
  permissionLevel: number;
}

const initialState: LoginState = {
	isLoggedIn: false,
	name: '',
	sub_id: '',
	permissionLevel: 0,
};

export const login = writable<LoginState>(initialState);

export function getCanOnlyEditWhenLoggedIn() {
	if (typeof window === 'undefined') {
		throw new Error('Could not get permission canOnlyEditWhenLoggedIn: window is undefined');
	}

	return localStorage.getItem('editOnLogin') === 'true';
}

export function setCanOnlyEditWhenLoggedIn(value: boolean) {
	if (typeof window === 'undefined') {
		throw new Error('Could not set permission canOnlyEditWhenLoggedIn: window is undefined');
	}

	localStorage.setItem('editOnLogin', String(value));
}

export function permissionsAllowEdit(minimumPermissionLevel: number) {
	return !getCanOnlyEditWhenLoggedIn() || currentPermissionLevelIsAtLeast(minimumPermissionLevel);
}

export function currentPermissionLevel() {
	const currentLogin = get(login);
	return currentLogin.permissionLevel ?? 0;
}

export function currentPermissionLevelIsAtLeast(level: number) {
	const currentLogin = get(login);
	return currentLogin?.isLoggedIn && currentLogin?.permissionLevel >= level;
}
