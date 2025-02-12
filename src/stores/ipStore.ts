import { writable } from 'svelte/store';

export const ip = writable<string | null>(null);

export async function fetchIp() {
  try {
    const response = await fetch('/api/ip');
    const data = await response.json();
    ip.set(data.ip);
    console.log('IP fetched from server and stored:', data.ip);
  } catch (err) {
    console.error('Error fetching IP:', err);
  }
}