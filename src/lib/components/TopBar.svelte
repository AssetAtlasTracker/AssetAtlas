<script lang="ts">
	import { setTopBarHeight } from '$lib/stores/topBarStore.js';
	import { AppBar, Switch } from "@skeletonlabs/skeleton-svelte";
	import { Menu } from "lucide-svelte";
	import { onMount } from 'svelte';
	import { login } from "../stores/loginStore.js";
	import SearchBar from "./SearchBar.svelte";

	let {
		searchQuery = $bindable(""),
		onSearch,
		menu = $bindable(),
		exactSearch = $bindable(false),
		onExactSearchChange
	} = $props<{
		searchQuery?: string;
		onSearch: (query: string) => void;
		menu?: HTMLDialogElement;
		exactSearch?: boolean;
		onExactSearchChange?: (value: boolean) => void;
	}>();

	function handleClickMenu() {
		menu?.click();
	}

	let topBarElement: HTMLDivElement;

	let currentLogin = $derived($login);

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
					<Menu />
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
			<div class="sort-flex"></div>

			<div class="loginUser" style="font-size: larger; margin-left: auto; padding-right: 2rem;">
				{#if currentLogin?.isLoggedIn}
					User: {currentLogin?.name}
				{:else}
					Not Logged In
				{/if}
			</div>
		</div>
		
	</AppBar>
</div>
