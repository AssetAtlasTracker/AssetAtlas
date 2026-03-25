import { writable } from 'svelte/store';

export interface UserState {
  isLoggedIn: boolean;
  username: string;
  permissionLevel: number;
  id: string;
}

const initialState: UserState = {
	isLoggedIn: false,
	username: '',
	permissionLevel: 0,
	id: ''
};

export const user = writable<UserState>(initialState);
