import type { PageLoad } from '@sveltejs/kit';
import type { IBasicItemPopulated } from '$lib/server/db/models/basicItem.js';

export const load: PageLoad = async ({ params, fetch }) => {
  try {
    const response = await fetch(`/api/items/${params.id}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch item: ${response.status}`);
    }
    
    const item: IBasicItemPopulated = await response.json();
    
    return {
      item
    };
  } catch (error) {
    console.error('Error loading item:', error);
    return {
      item: null
    };
  }
};