import Template from '$lib/server/db/models/template.js';
import { deleteHelper, getHelper } from '$lib/utility/routesHelper';
import type { RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ params }) => {
	return await getHelper(params, getTemplate);
};

const getTemplate = async (id: string) => {
	return await Template.findById(id).populate('fields').exec();
}

export const DELETE: RequestHandler = async ({ params }) => {
	return await deleteHelper(params, deleteTemplate);
};

const deleteTemplate = async (id: string) => {
	return await Template.findByIdAndDelete(id).exec();
}
