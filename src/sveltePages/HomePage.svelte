<script lang="ts">
    import { AppBar } from "@skeletonlabs/skeleton";
    import SearchBar from "./svelteComponents/SearchBar.svelte";
    import ItemList from "./svelteComponents/ItemList.svelte";
    import Dialog from "./svelteComponents/Dialog.svelte";
    let ip = process.env.IP;
    fetchIp();
    let name = "";
    let description = "";
    let tags = "";
    let containedItems = "";
    let searchQuery = "";
    let searchResults: any[] = []; //array of anything or a specific type
    let dialog: { showModal: () => any };

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
                    },
                },
            );

            const contentType = response.headers.get("Content-Type");
            console.log("Content-Type:", contentType);

            const rawResponse = await response.text();
            console.log("Raw response:", rawResponse); //This should print the raw response

            if (!response.ok) {
                throw new Error("Failed to fetch items");
            }

            if (contentType && contentType.includes("application/json")) {
                const data = JSON.parse(rawResponse);
                searchResults = data;
            } else {
                console.error("Response is not JSON:", rawResponse);
            }
        } catch (err) {
            console.error("Error searching items:", err);
        }
    }
</script>

<AppBar class="border-gray-400 shadow" background="bg-white">
    <svelte:fragment slot="lead">(actions)</svelte:fragment>
    <div class="flex px-4 grid grid-cols-4">
      <div class="text-2xl font-bold">Asset Atlas</div>
      <div class="flex-auto pb-4">
        <SearchBar searchQuery={searchQuery} onSearch={handleSearch}/>
      </div>
    </div>
    <svelte:fragment slot="trail">(profile icon)</svelte:fragment>
  </AppBar>