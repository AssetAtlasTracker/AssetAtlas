/**
 * @vitest-environment jsdom
 */

import { describe, it, vi, expect, beforeEach } from "vitest";
import EditItem from "../src/svelteComponents/EditItem.svelte";

function renderComponent(props = {}) {
	const target = document.createElement("div");
	document.body.appendChild(target);
	const component = new EditItem({ target, props });
	return { target, component };
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

vi.mock("../src/stores/actionStore.js", () => ({
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

		global.fetch = fetchMock;
	});

	it("renders EditItem form with expected inputs", () => {
		const { target } = renderComponent({ item: mockItem });

		expect(target.querySelector("form")).toBeTruthy();
		expect(target.innerHTML).toContain("Name (required)");
		expect(target.innerHTML).toContain("Submit Changes");
	});

	it("submits form and calls fetch with PATCH", async () => {
		const { target } = renderComponent({ item: mockItem });

		const nameInput = target.querySelector('input[type="text"]') as HTMLInputElement;
		nameInput.value = "Updated Item";
		nameInput.dispatchEvent(new Event("input", { bubbles: true }));

		const form = target.querySelector("form")!;
		form.dispatchEvent(new Event("submit", { cancelable: true, bubbles: true }));

		await Promise.resolve();

		expect(fetchMock).toHaveBeenCalled();
		const lastCall = fetchMock.mock.calls.find(([url]) => url.includes("/api/items/123"));
		expect(lastCall?.[1]?.method).toBe("PATCH");
	});

	it("dispatches 'itemUpdated' event on successful update", async () => {
		const { component } = renderComponent({ item: mockItem });

		let eventTriggered = false;
		component.$on("itemUpdated", () => (eventTriggered = true));

		await component.handleEditItem();

		expect(eventTriggered).toBe(true);
	});
});