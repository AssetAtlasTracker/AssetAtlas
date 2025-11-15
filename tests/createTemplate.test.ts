/**
 * @vitest-environment jsdom
 */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { render, fireEvent, waitFor } from '@testing-library/svelte';
import { vi } from 'vitest';
import CreateTemplate from '../src/svelteComponents/CreateTemplate.svelte';

vi.mock('../src/stores/actionStore.js', () => ({
	actionStore: { addMessage: vi.fn() },
}));

vi.mock('../src/svelteComponents/CustomFieldPicker.svelte', () => ({
	default: () => '<div data-testid="custom-field-picker"></div>',
}));

vi.mock('../src/svelteStyles/main.css', () => ({}));

global.fetch = vi.fn(() =>
	Promise.resolve({
		ok: true,
		json: () => Promise.resolve({ _id: 'mock-id', name: 'Mock Template' }),
	}),
) as any;

describe('CreateTemplate.svelte', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('renders the form with required fields', () => {
		const { getByText, getByLabelText } = render(CreateTemplate);

		expect(getByText('Create New Template')).toBeTruthy();
		expect(getByLabelText('Name:')).toBeTruthy();
		expect(getByText('Add Custom Field')).toBeTruthy();
		expect(getByText('Create Template')).toBeTruthy();
	});

	it('calls handleCreateTemplate and dispatches events on submit', async () => {
		const { getByText, getByLabelText, component } = render(CreateTemplate);

		// Fill in name input
		const nameInput = getByLabelText('Name:') as HTMLInputElement;
		await fireEvent.input(nameInput, { target: { value: 'My Template' } });

		// Track event dispatches
		let templateCreated = false;
		let closeDispatched = false;
		component.$on('templateCreated', () => (templateCreated = true));
		component.$on('close', () => (closeDispatched = true));

		// Submit the form
		const submitButton = getByText('Create Template');
		await fireEvent.click(submitButton);

		// Wait for events to trigger
		await waitFor(() => {
			expect(templateCreated).toBe(true);
			expect(closeDispatched).toBe(true);
		});
	});

	it('shows error message if template creation fails', async () => {
		// Mock a failed fetch response
		(global.fetch as any).mockResolvedValueOnce({
			ok: false,
			json: async () => ({ message: 'Error creating template' }),
		});

		const { getByText, getByLabelText } = render(CreateTemplate);
		const nameInput = getByLabelText('Name:') as HTMLInputElement;
		await fireEvent.input(nameInput, { target: { value: 'Invalid Template' } });

		const submitButton = getByText('Create Template');
		await fireEvent.click(submitButton);

		await waitFor(() => {
			expect(getByText('Create Template')).toBeTruthy();
		});

		// Verify addMessage was called with an error
		const { actionStore } = await import('../src/stores/actionStore.js');
		expect(actionStore.addMessage).toHaveBeenCalledWith('Error creating template.');
	});
});
