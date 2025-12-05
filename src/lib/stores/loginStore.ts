import { writable } from 'svelte/store';

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

export function toggleEditOnLogin(value?: boolean) {
	if (value !== undefined && typeof window !== 'undefined') {
		localStorage.setItem('editOnLogin', String(value));
	}
}

export function getEditOnLogin() {
	if (typeof window === 'undefined') {
		return false;
	}
	return localStorage.getItem('editOnLogin') === 'true';
}

export const login = writable<LoginState>(initialState);