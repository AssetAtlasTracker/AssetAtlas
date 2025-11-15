/* eslint-disable @typescript-eslint/no-explicit-any */

import { describe, it, vi, expect, beforeEach } from "vitest";
import { render } from '@testing-library/svelte';
import EditItem from "$lib/components/EditItem.svelte";

function renderComponent(props: any = {}) {
	return render(EditItem, { props });
}

if (typeof HTMLDialogElement !== "undefined") {
	if (!HTMLDialogElement.prototype.close) {
		HTMLDialogElement.prototype.close = vi.fn();
	}
	if (!HTMLDialogElement.prototype.showModal) {
		HTMLDialogElement.prototype.showModal = vi.fn();
	}
} else {
	(global as any).HTMLDialogElement = class {
		close = vi.fn();
		showModal = vi.fn();
	};
}

vi.mock("$lib/stores/actionStore.js", () => ({
	actionStore: {
		addMessage: vi.fn(),
	},
}));

describe("EditItem.svelte", () => {
	let fetchMock: any;
	let mockItem: any;

	beforeEach(() => {
		vi.restoreAllMocks();

		mockItem = {
			_id: "123",
			name: "Test Item",
			description: "A test item",
			tags: ["example"],
			parentItem: null,
			homeItem: null,
			template: null,
			image: null,
			customFields: [],
		};

		fetchMock = vi.fn(async (url, options) => {
			if (url.includes("/api/items/123") && options?.method === "PATCH") {
				return {
					ok: true,
					json: async () => ({ _id: "123", name: "Updated Item" }),
				};
			}

			return {
				ok: true,
				json: async () => [],
				blob: async () => new Blob(),
			};
		});

		vi.stubGlobal('fetch', fetchMock);
	});

	it("renders EditItem form with expected inputs", () => {
		const { container } = renderComponent({ item: mockItem });

		expect(container.querySelector("form")).toBeTruthy();
		expect(container.innerHTML).toContain("Name (required)");
		expect(container.innerHTML).toContain("Submit Changes");
	});

	it("submits form and calls fetch with PATCH", async () => {
		const { container } = renderComponent({ item: mockItem });

		const nameInput = container.querySelector('input[type="text"]') as HTMLInputElement;
		nameInput.value = "Updated Item";
		nameInput.dispatchEvent(new Event("input", { bubbles: true }));

		const form = container.querySelector("form")!;
		form.dispatchEvent(new Event("submit", { cancelable: true, bubbles: true }));

		// Wait for async operations
		await new Promise(resolve => setTimeout(resolve, 50));

		expect(fetchMock).toHaveBeenCalled();
		const lastCall = fetchMock.mock.calls.find(([url]: any) => url.includes("/api/items/123"));
		expect(lastCall?.[1]?.method).toBe("PATCH");
	});
});