<script lang="ts">
	let {
		searchQuery = $bindable(""),
		onSearch,
		results = $bindable<{ name: string }[]>([]),
	} = $props<{
		searchQuery?: string;
		onSearch: (query: string) => void;
		results?: { name: string }[];
	}>();

	let debounceTimeout: ReturnType<typeof setTimeout> | undefined;

	$effect(() => {
		if (searchQuery !== undefined) {
			if (debounceTimeout) clearTimeout(debounceTimeout);
			debounceTimeout = setTimeout(() => {
				onSearch(searchQuery);
			}, 300);
		}
		return () => {
			if (debounceTimeout) clearTimeout(debounceTimeout);
		};
	});

	function handleInput(event: Event) {
		const target = event.target as HTMLInputElement;
		if (target) {
			searchQuery = target.value;
		}
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	function selectSuggestion(suggestion: any) {
		searchQuery = suggestion.name;
		onSearch(searchQuery);
		results = [];
	}
</script>

<div class="flex flex-col relative">
	<input
		class="flex-auto searchbar py-2 px-4"
		type="text"
		placeholder="Search items"
		bind:value={searchQuery}
		oninput={handleInput}
	/>

	<!-- Display live search suggestions -->
	{#if results.length > 0}
		<ul class="suggestions">
			{#each results as result}
				<button
					class="suggestion-item"
					type="button"
					onclick={() => selectSuggestion(result)}
				>
					{result.name}
				</button>
			{/each}
		</ul>
	{/if}
</div>
