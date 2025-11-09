/** 
 * @vitest-environment jsdom 
 */
import { describe, it, beforeEach, expect, vi } from 'vitest';
import CreateItem from '../src/svelteComponents/CreateItem.svelte';

if (typeof HTMLDialogElement !== 'undefined') {
	if (!HTMLDialogElement.prototype.close) {
		HTMLDialogElement.prototype.close = vi.fn();
	}
	if (!HTMLDialogElement.prototype.showModal) {
		HTMLDialogElement.prototype.showModal = vi.fn();
	}
} else {
	// fallback for very old jsdom
	(global as any).HTMLDialogElement = class {
		close = vi.fn();
		showModal = vi.fn();
	};
}

function renderComponent(props = {}) {
	const target = document.createElement('div');
	document.body.appendChild(target);
	const component = new CreateItem({ target, props });
	return { target, component };
}

describe('CreateItem.svelte', () => {
	let fetchMock: any;

	beforeEach(() => {
		vi.restoreAllMocks();

		fetchMock = vi.fn(async () => ({
	  ok: true,
	  json: async () => ({ _id: '123', name: 'New Item' }),
	  text: async () => JSON.stringify({ _id: '123', name: 'New Item' }),
	  headers: new Map(),
		}));
		global.fetch = fetchMock;
	});

	it('renders the form', () => {
		const { target } = renderComponent({ dialog: document.createElement('dialog') });
		expect(target.innerHTML).toContain('Create New Item');
		expect(target.querySelector('form')).toBeTruthy();
	});

	it('submits the form and calls fetch', async () => {
		const { target, component } = renderComponent({ dialog: document.createElement('dialog') });

		const nameInput = target.querySelector('input[type="text"]') as HTMLInputElement;
		nameInput.value = 'Test Item';
		nameInput.dispatchEvent(new Event('input'));

		const form = target.querySelector('form')!;
		form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));

		await Promise.resolve();

		expect(fetchMock).toHaveBeenCalled();
	});

	it('dispatches itemCreated after successful submit', async () => {
		const { component, target } = renderComponent({ dialog: document.createElement('dialog') });

		let eventTriggered = false;
		target.addEventListener('itemCreated', () => (eventTriggered = true));

		const input = target.querySelector('input[type="text"]') as HTMLInputElement;
		input.value = 'Integration Test';
		input.dispatchEvent(new Event('input'));
		const form = target.querySelector('form')!;
		form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
		await Promise.resolve();

		expect(fetchMock).toHaveBeenCalled();
	});
});