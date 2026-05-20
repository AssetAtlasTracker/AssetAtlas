import { error, json } from '@sveltejs/kit';
import mongoose from 'mongoose';

interface Params {
    id?: string | undefined;
    parentID?: string | undefined;
    type?: string | undefined;
    templateName?: string | undefined;
}

function validateID(id: string | undefined) {
	if (!id || !mongoose.Types.ObjectId.isValid(id)) {
		throw error(400, 'Invalid MongoDB ID');
	}
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getHelper(params: Params, getFunction: (id: string) => Promise<any>) {
	const { id } = params;
	validateID(id);

	const retrieved = await getFunction(id as string);
	if (!retrieved) {
		throw error(404, 'Get failed: could not find match for id: ' + id);
	}

	return json(retrieved, { status: 200 });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function deleteHelper(params: Params, deleteFunction: (id: string) => Promise<any>) {
	const { id } = params;
	validateID(id);

	const deleted = await deleteFunction(id as string);
	if (!deleted) {
		throw error(404, 'Delete failed: could not find match for id: ' + id);
	}

	return json({ message: 'Delete successful', deleted }, { status: 200 });
}
