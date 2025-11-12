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

export const login = writable<LoginState>(initialState);