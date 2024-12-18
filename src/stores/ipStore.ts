import { writable } from 'svelte/store';

export const ip = writable<string | null>(null);

export async function fetchIp() {
  try {
    const response = await fetch('/api/ip');
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const text = await response.text(); // Read the raw text response
    try {
      const data = JSON.parse(text); // Attempt to parse JSON
      if (data && data.ip) {
        ip.set(data.ip);
        console.log('IP fetched from server:', data.ip);
      } else {
        throw new Error('Malformed JSON: Missing "ip" property.');
      }
    } catch (parseError) {
      console.error('Error parsing JSON:', parseError, 'Response text:', text);
    }
  } catch (err: any) {
    console.error('Error fetching IP:', (err as Error).message);
    ip.set(null);
  }
}