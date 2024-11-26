<script lang="ts">
    import SearchBar from "$lib/components/SearchBar.svelte";
    import ItemList from "$lib/components/ItemList.svelte";
    import AddItem from "$lib/components/AddItem.svelte";

    let ip = process.env.IP; // Default IP (set it to 3000 if not defined)
    fetchIp();
    let searchQuery = "";
    let searchResults: any[] = [];

    async function fetchIp() {
        try {
            const response = await fetch("/api/ip");
            const data = await response.json();
            ip = data.ip;
            console.log("IP fetched from server:", ip);
        } catch (err) {
            console.error("Error fetching IP:", err);
        }
    }

    async function handleSearch(query: string) {
        searchQuery = query;
        try {
            const response = await fetch(
                `http://${ip}/api/items/search?name=${encodeURIComponent(searchQuery)}`,
                {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                    }
                }
            );

            const contentType = response.headers.get("Content-Type");
            console.log("Content-Type:", contentType);

            const rawResponse = await response.text();
            console.log("Raw response:", rawResponse);

            if (!response.ok) {
                throw new Error("Failed to fetch items");
            }

            if (contentType && contentType.includes("application/json")) {
                searchResults = JSON.parse(rawResponse);
            } else {
                console.error("Response is not JSON:", rawResponse);
            }
        } catch (err) {
            console.error("Error searching items:", err);
        }
    }

    function handleItemAdded(item: any) {
        console.log("New item added:", item);
        // Optionally refresh the search results or add to a list
        searchResults = [item, ...searchResults];
    }
</script>

<div class="search-section">
    <SearchBar searchQuery={searchQuery} onSearch={handleSearch} />
</div>

<div class="results-section">
    {#if searchResults.length > 0}
        <ItemList {searchResults} />
    {:else if searchQuery !== ''}
        <p>No items found for "{searchQuery}".</p>
    {/if}
</div>

<AddItem {ip} onItemAdded={handleItemAdded} />

<style>
    .search-section {
        margin-bottom: 2rem;
    }

    .results-section {
        margin-top: 2rem;
    }
</style>