import BasicItem from '$lib/server/db/models/basicItem';
import { error, json } from '@sveltejs/kit';

export async function retrieveAttributeWhenGiven(givenTerm: string, url: URL) {
	let searchParam, givenKey, retrievedTerm, retrievedKey: string;
	if (givenTerm === 'id') {
		searchParam = 'itemID';
		givenKey = '_id';
		retrievedTerm = 'name';
		retrievedKey = 'name';
	} else if (givenTerm === 'name') {
		searchParam = 'itemName';
		givenKey = 'name';
		retrievedTerm = 'id';
		retrievedKey = '_id';
	} else {
		throw error(500, 'Invalid attribute provided: ' + givenTerm);
	}

	const givenAttribute = url.searchParams.get(searchParam);
	if (!givenAttribute) {
		throw error(500, `Accessing "${searchParam}" in search params failed to return a value`);
	}

	const retrievedAttribute = await BasicItem.findOne({ [givenKey]: givenAttribute }).select(retrievedKey).exec();
	if (!retrievedAttribute) {
		return json({ [retrievedTerm]: null });
	}

	return json({ [retrievedTerm]: retrievedAttribute[retrievedKey].toString() });
}
