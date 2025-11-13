import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import CustomField from '$lib/server/db/models/customField.js';
import Template from '$lib/server/db/models/template.js';
import type { ICustomField } from '$lib/server/db/models/customField.js';
import Fuse from 'fuse.js';

export const GET: RequestHandler = async ({ url }) => {
  const fieldName = url.searchParams.get('fieldName');

  const customFields = await CustomField.find({}).exec();

  if (fieldName) {
    const fuse = new Fuse(customFields, {
      keys: ['fieldName'],
      threshold: 0.3,
    });

    const fuzzyResults = fuse.search(fieldName);
    const resultFields = fuzzyResults.map(result => result.item);

    return json(resultFields);
  } else {
    return json(customFields);
  }
};