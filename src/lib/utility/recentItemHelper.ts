export async function addToRecents(type: string, item: any) {
	try {
		const body = JSON.stringify({
			type,
			itemId: item._id,
		});

		const response = await fetch(`/api/recentItems/add`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: body,
		});

		const responseText = await response.text();

		if (!response.ok) {
			throw new Error(`Failed to add to recents: ${responseText}`);
		}
	} catch (err) {
		console.error("Error adding to recents:", err);
	}
}