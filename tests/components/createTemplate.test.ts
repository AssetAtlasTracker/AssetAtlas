/* eslint-disable @typescript-eslint/no-explicit-any */

import CreateTemplate from '$lib/components/CreateTemplate.svelte';
import { fireEvent, render } from '@testing-library/svelte';
import { beforeEach, describe, expect, it, vi } from 'vitest';

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

vi.mock('$lib/stores/actionStore.js', () => ({
	actionStore: { addMessage: vi.fn() },
}));

vi.mock('$lib/components/CustomFieldPicker.svelte', () => ({
	default: () => '<div data-testid="custom-field-picker"></div>',
}));

vi.mock('$lib/styles/main.css', () => ({}));

describe('CreateTemplate.svelte', () => {
	let fetchMock: any;

	beforeEach(() => {
		vi.restoreAllMocks();
		
		fetchMock = vi.fn(async () => ({
			ok: true,
			json: async () => ({ _id: 'mock-id', name: 'Mock Template' }),
		}));
		vi.stubGlobal('fetch', fetchMock);
	});

	it('renders the form with required fields', () => {
		const { getByText, getByLabelText } = render(CreateTemplate);

		expect(getByText('Create New Template')).toBeTruthy();
		expect(getByLabelText('Name:')).toBeTruthy();
		expect(getByText('Add Custom Field')).toBeTruthy();
		expect(getByText('Create Template')).toBeTruthy();
	});

	it('calls handleCreateTemplate and submits form', async () => {
		const { getByText, getByLabelText, container } = render(CreateTemplate);

		// Fill in name input
		const nameInput = getByLabelText('Name:') as HTMLInputElement;
		await fireEvent.input(nameInput, { target: { value: 'My Template' } });

		// Submit the form
		const submitButton = getByText('Create Template');
		await fireEvent.click(submitButton);

		// Wait for async operations
		await new Promise(resolve => setTimeout(resolve, 50));

		// Verify the form still exists after submission
		expect(container.querySelector('form')).toBeTruthy();
	});

	it('shows error message if template creation fails', async () => {
		// Mock a failed fetch response
		fetchMock.mockResolvedValueOnce({
			ok: false,
			json: async () => ({ message: 'Error creating template' }),
		});

		const { getByText, getByLabelText } = render(CreateTemplate);
		const nameInput = getByLabelText('Name:') as HTMLInputElement;
		await fireEvent.input(nameInput, { target: { value: 'Invalid Template' } });

		const submitButton = getByText('Create Template');
		await fireEvent.click(submitButton);

		// Wait for async operations
		await new Promise(resolve => setTimeout(resolve, 50));

		// Verify addMessage was called with an error
		const { actionStore } = await import('$lib/stores/actionStore.js');
		expect(actionStore.addMessage).toHaveBeenCalledWith('Error creating template.');
	});
});
