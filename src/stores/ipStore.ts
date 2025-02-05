import { writable } from 'svelte/store';

export const ip = writable<string | null>(null);

export async function fetchIp() {
  const storedIp = localStorage.getItem('ip');
  if (storedIp) {
    ip.set(storedIp);
    console.log('Loaded IP from localStorage:', storedIp);
    return;
  }

  try {
    const response = await fetch('/api/ip');
    const data = await response.json();
    ip.set(data.ip);
    localStorage.setItem('ip', data.ip);
    console.log('IP fetched from server and stored:', data.ip);
  } catch (err) {
    console.error('Error fetching IP:', err);
  }
}