import { writable } from 'svelte/store';

export const ip = writable<string | null>(null);

export async function fetchIp() {
  try {
    const response = await fetch('/api/ip');
    const data = await response.json();
    if (!data.ip || data.ip === 'null') {
      data.ip = 'localhost:3000';
    }
    ip.set(data.ip);
    localStorage.setItem('ip', data.ip);
    console.log('IP fetched from server and stored:', data.ip);
  } catch (err) {
    console.error('Error fetching IP:', err);
  }
}