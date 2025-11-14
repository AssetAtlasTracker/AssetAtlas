<script lang="ts">
	import { AppBar } from "@skeletonlabs/skeleton-svelte";
	import { Switch } from "@skeletonlabs/skeleton-svelte";
	import SearchBar from "./SearchBar.svelte";
	import MdMenu from "svelte-icons/md/MdMenu.svelte";
	import { onMount } from 'svelte';
	import { setTopBarHeight } from '$lib/stores/topBarStore.js';

	// Props using $props() rune
	let {
		searchQuery = $bindable(""),
		onSearch,
		menu = $bindable(),
		exactSearch = $bindable(false),
		onExactSearchChange
	}: {
		searchQuery?: string;
		onSearch: (query: string) => void;
		menu?: HTMLDialogElement;
		exactSearch?: boolean;
		onExactSearchChange?: (value: boolean) => void;
	} = $props();

	function handleClickMenu() {
		menu?.click();
	}

	let topBarElement: HTMLDivElement;

	onMount(() => {
		if (topBarElement) {
			const height: number = topBarElement.getBoundingClientRect().height;
			setTopBarHeight(height);
		}

		const resizeObserver = new ResizeObserver((entries: ResizeObserverEntry[]) => {
			for (let entry of entries) {
				setTopBarHeight(entry.contentRect.height);
			}
		});

		if (topBarElement) {
			resizeObserver.observe(topBarElement);
		}

		return () => {
			if (topBarElement) {
				resizeObserver.unobserve(topBarElement);
			}
		};
	});

	function handleChange() {
		exactSearch = !exactSearch;
		onExactSearchChange?.(exactSearch);
	}
</script>

<div bind:this={topBarElement} class="top-bar-wrapper">
	<AppBar class="top-bar border glass">
		<div class="top-bar-flex">
			<button class="mx-4" onclick={handleClickMenu}>
				<div class="icon-small">
					<MdMenu />
				</div>
			</button>
			<div class="flex-1 m-4">
				<a href="/">
					<div id="title" class="mx-4 text-2xl font-bold">AssetAtlas</div>
				</a>
				<div class="mx-4">
					<SearchBar {searchQuery} {onSearch} />
				</div>
			</div>
			<div class="sort-flex"></div>

			<Switch 
				checked={exactSearch} 
				onchange={handleChange}
			>
				<Switch.Control>
					<Switch.Thumb />
				</Switch.Control>
				<Switch.Label>Exact Search</Switch.Label>
				<Switch.HiddenInput />
			</Switch>
		</div>
	</AppBar>
</div>