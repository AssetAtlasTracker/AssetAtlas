import BasicItem from '$lib/server/db/models/basicItem';
import { error, json } from '@sveltejs/kit';

export async function checkItemAttribute(attributeName: string, url: URL) {
	let searchParam, attributeKey, otherAttributeName, otherAttributeKey: string;
	if (attributeName === 'id') {
		searchParam = 'itemID';
		attributeKey = '_id';
		otherAttributeName = 'name';
		otherAttributeKey = 'name';
	} else if (attributeName === 'name') {
		searchParam = 'itemName';
		attributeKey = 'name';
		otherAttributeName = 'id';
		otherAttributeKey = '_id';
	} else {
		throw error(500, 'Invalid attribute provided: ' + attributeName);
	}

	const attribute = url.searchParams.get(searchParam);
	if (!attribute) {
		throw error(400, `No item ${attributeName} provided`);
	}

	const otherAttribute = await BasicItem.findOne({ [attributeKey]: attribute }).select(otherAttributeKey).exec();
	if (!otherAttribute) {
		return json({ [otherAttributeName]: null });
	}

	return json({ [otherAttributeName]: otherAttribute[otherAttributeKey].toString() });
}
