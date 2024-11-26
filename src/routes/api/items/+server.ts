import { json } from '@sveltejs/kit';
import { createItem, searchItems } from '$lib/controllers/itemController';

// Handle GET /api/items (you might want to list all items)
export const GET = async () => {
  const items = await searchItems({}); // Adjust as necessary
  return json(items);
};

// Handle POST /api/items
export const POST = async ({ request }) => {
  const data = await request.json();
  const newItem = await createItem(data);
  return json(newItem, { status: 201 });
};