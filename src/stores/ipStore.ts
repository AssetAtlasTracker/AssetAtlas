import { writable, derived } from 'svelte/store';

export const ip = writable<string | null>(null);

export const apiBaseUrl = derived(ip, $ip => {
  //in browser, use relative URLs for local development
  if (!$ip || $ip.includes('localhost')) {
    return '';
  }
  //For Tailscale use absolute URLs
  return `http://${$ip}`;
});

export async function fetchIp() {
  try {
    const response = await fetch('/api/ip');
    if (!response.ok) {
      throw new Error(`Failed to fetch IP: ${response.status}`);
    }
    const data = await response.json();
    ip.set(data.ip);
    console.log('IP fetched from server and stored:', data.ip);
  } catch (err) {
    console.error('Error fetching IP:', err);
    //fallback
    ip.set('localhost:3000');
  }
}