<script lang="ts">
	import Dialog from "$lib/components/Dialog.svelte";
	import Menu from "$lib/components/Menu.svelte";
	import TopBar from "$lib/components/TopBar.svelte";
	import type { IBasicItemPopulated } from "$lib/server/db/models/basicItem.js";
	import type { ITemplatePopulated } from "$lib/server/db/models/template.js";
	import { ip } from "$lib/stores/ipStore.js";
	import "$lib/styles/main.css";
	import {
		downloadDataFile,
		downloadFile,
	} from "$lib/utility/file/FileDownloader.js";
	import { CSVFormatterPopulated } from "$lib/utility/formating/CSVFormatterPopulated.js";
	import JSZip from "jszip";
	import { onMount } from "svelte";

	let files: FileList;
	let dialog: HTMLDialogElement;
	let itemInput: string = "";
	let templateInput: string = "";
	let menu: HTMLDialogElement;

	let csvData: string[] = [];
	let images: File[] = [];
	let addedLength = 0;

	function setDialogText(text: string) {
		document.getElementById("dialog-text")!.innerText = text;
	}

	async function handleFile(file: File, last: boolean) {
		let type = getTypeOfFile(file.name);
		switch (type) {
			case ".jpeg":
			case ".jpg":
			case ".png":
				handleImportImages(file);
				break;
			case ".csv":
				handleImportCSV(file, last);
				break;
			case ".zip":
				await handleImportZip(file, last);
				break;
			default:
				throw new Error(
					"Error: Unexpected Type of File Inputted: " + type,
				);
		}
	}

	function getTypeOfFile(name: string) {
		const ind = name.lastIndexOf(".");
		return name.substring(ind, name.length).toLowerCase();
	}

	async function handleSelected() {
		console.log("import functionality is temporarily disabled");
		return;
		try {
			if (!files) {
				return;
			}
			if (files.length >= 1) {
				for (var i = 0; i < files.length; i++) {
					var item = files.item(i)!;
					let last = false;
					if (i == files.length - 1) last = true;
					await handleFile(item, last);
				}
				if (
					images.length + csvData.length ==
					files.length + addedLength
				) {
					// done -- last to finish was not a csv, so continue.
					handleCallImport();
				}
			}
		} catch (err) {
			console.error("Error importing:", err);
			setDialogText("Error Importing from Files.");
			dialog.showModal();
		}
	}

	async function handleCallImport() {
		try {
			let formdata = new FormData();
			for (var i = 0; i < images.length; i++) {
				formdata.append("images", images[i]);
				formdata.append("names", images[i].name);
			}
			formdata.append("data", "");
			for (var j = 0; j < csvData.length; j++) {
				formdata.append("data", csvData[j]);
			}
			const response = await fetch(`/api/csv/import`, {
				method: "POST",
				headers: { enctype: "multipart/form-data" },
				body: formdata,
			});
			if (!response.ok) throw new Error("Error Importing from Files.");
			setDialogText("Files Imported Successfully!");
			dialog.showModal();
		} catch (err) {
			console.error("Error importing:", err);
			setDialogText("Error Importing from Files.");
			dialog.showModal();
		}
	}

	async function handleExport() {
		console.log("export functionality is temporarily disabled");
		return; // Temporarily disabled
		try {
			const responseT = await fetch(`/api/templates/getTemplates`, {
				method: "GET",
				headers: { "Content-Type": "application/json" },
			});
			if (!responseT.ok) throw new Error("Failed to fetch templates");
			let templates: ITemplatePopulated[] = [];
			const dataT = await responseT.json();
			templates = dataT as ITemplatePopulated[];
			const responseI = await fetch(
				`/api/items/search?name=${encodeURIComponent("")}`,
				{
					method: "GET",
					headers: { "Content-Type": "application/json" },
				},
			);
			if (!responseI.ok) throw new Error("Failed to fetch items");
			let items = [];
			const dataI = await responseI.json();
			items = dataI as IBasicItemPopulated[];
			const images = items
				.map((item) => {
					return item.image;
				})
				.filter((res) => {
					return res !== undefined;
				});
			const imageData = images.map((image) => {
				return { _id: image._id, filename: image.filename };
			});
			const itemRoot = items.filter((item) => {
				return item.parentItem == null;
			});
			const formatter = new CSVFormatterPopulated(
				items,
				templates,
				itemRoot,
				imageData,
			);
			const templateContent = formatter.formatTemplates();
			const itemContent = formatter.formatItems();

			let urls: string[] = [];
			let names: string[] = [];
			for (var i = 0; i < items.length; i++) {
				const item = items[i];
				if (item.image) {
					const responseImg = await fetch(
						`http://${$ip}/api/items/${item._id}/image`,
					);
					if (responseImg.ok) {
						urls.push(`http://${$ip}/api/items/${item._id}/image`);
						names.push(item.image!.filename);
					}
				}
			}

			if (!itemInput) {
				itemInput = "items";
			}
			if (!templateInput) {
				templateInput = "templates";
			}

			downloadDataFile(itemInput, itemContent);
			downloadDataFile(templateInput, templateContent);
			for (var i = 0; i < urls.length; i++) {
				downloadFile(urls[i], names[i]);
			}

			itemInput = "";
			templateInput = "";

			setDialogText("Data Exported Successfully!");
			dialog.showModal();
		} catch (err) {
			console.error("Error exporting:", err);
			setDialogText("Error Exporting to Files.");
			dialog.showModal();
		}
	}

	function handleImportImages(item: File) {
		images.push(item);
	}

	function handleImportCSV(item: File, last: boolean) {
		const reader = new FileReader();
		reader.addEventListener("load", () => {
			if (!csvData.includes(reader.result as string)) {
				csvData.push(reader.result as string);
			}
			if (last) {
				handleCallImport();
			}
		});
		reader.readAsText(item);
	}

	async function handleImportZip(item: File, last: boolean) {
		const zip = new JSZip();
		const unzipped = await zip.loadAsync(item);
		addedLength -= 1;
		const length = Object.keys(unzipped.files).length;
		let blobs: Promise<Blob>[] = [];
		let objs: JSZip.JSZipObject[] = [];
		unzipped.forEach((path, obj) => {
			i++;
			if (!obj.dir) {
				objs.push(obj);
				addedLength++;
				blobs.push(obj.async("blob"));
			}
		});
		const loadedBlobs = await Promise.all(blobs);
		for (var i = 0; i < loadedBlobs.length; i++) {
			const file = new File([loadedBlobs[i]], objs[i].name, {
				lastModified: objs[i].date.getTime(),
			});
			await handleFile(file, last && i == loadedBlobs.length - 1);
		}
	}

	function onSearch(query: string) {}

	onMount(() => {
		document.title = "Import/Export - AssetAtlas";
	});
</script>

<TopBar searchQuery="" {onSearch} {menu} exactSearch={false} />
<Menu bind:menu />

<div class="page-with-topbar">
	<div
		class="glass page-component util-component"
		style="background:rgba(200, 60, 70, 0.4) !important; width:95%;">
		<p class="important-text">
			Notice: Import and Export features are under construction and
			functionality is currently disabled.
		</p>
	</div>

	<div class="util-flex">
		<div class="glass page-component util-component">
			<p class="important-text">Import</p>
			<br />
			<label for="many">Select CSV Files:</label>
			<input
				class="dark-textarea"
				accept=".csv,.zip,.png,.jpg"
				bind:files
				id="many"
				multiple
				type="file" />
			<button class="border-button w-full my-4" on:click={handleSelected}>
				Import From CSV
			</button>
		</div>

		<div class="glass page-component util-component">
			<p class="important-text">Export</p>
			<br />

			<label for="itemCSVName">Name for exported item .csv file:</label>
			<input
				class="dark-textarea py-2 px-4 my-4"
				type="text"
				placeholder="assetatlas-inventory"
				id="itemCSVName"
				bind:value={itemInput} />
			<label for="templateCSVName"
				>Name for exported template .csv file:</label>
			<input
				class="dark-textarea py-2 px-4 my-4"
				type="text"
				placeholder="assetatlas-templates"
				id="templateCSVName"
				bind:value={templateInput} />
			<br />
			<button class="border-button w-full my-4" on:click={handleExport}>
				Export To CSV
			</button>
		</div>
	</div>
</div>

<Dialog
	bind:dialog
	isLarge={false}
	create={() => {}}
	close={() => dialog.close()}>
	<div id="dialog-text" class="simple-dialog-spacing">Some dialog text</div>
</Dialog>
