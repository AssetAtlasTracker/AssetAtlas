<script lang="ts">
   import { AppBar } from '@skeletonlabs/skeleton';
    import '../svelteStyles/main.css';
    import { ip } from '../stores/ipStore.js';
    import type { IBasicItemPopulated } from '../models/basicItem.js';
    import { CSVFormatterPopulated } from '../utility/formating/CSVFormatterPopulated.js';
    import type { ITemplatePopulated } from '../models/template.js';
    import Dialog from '../svelteComponents/Dialog.svelte';
    import { downloadFile } from '../utility/file/FileDownloader.js';
    import JSZip from "jszip";

    let files : FileList;
    let dialog: HTMLDialogElement;
    let itemInput: string ="";
    let templateInput : string="";

    let csvData : string[] = [];
    let images : File[] = [];
    let addedLength = 0;


    function goBack() {
      window.history.back();
    }//we gonna change this later fr fr

    function setDialogText(text: string) {
      document.getElementById("dialog-text")!.innerText = text;
    }

    async function handleFile(file: File, last: boolean) {
      let type = getTypeOfFile(file.name);
      switch (type) {
            case ".jpeg":
            case ".jpg" : console.log("handling", type);
            case ".png" : handleImportImages(file); break;
            case ".csv" : handleImportCSV(file,last); break;
            case ".zip" : await handleImportZip(file,last); break;
            default: throw new Error("Error: Unexpected Type of File Inputted: " + type);
          }
    }

    function getTypeOfFile(name : string) {
      const ind = name.lastIndexOf('.');
      return name.substring(ind, name.length).toLowerCase();
    }

    async function handleSelected() {
      try {
        if (!files) {
          console.error("handle called when nothing selected.");
          return;
        }
        if (files.length >= 1) {
          for (var i = 0; i < files.length; i++) {
            var item = files.item(i)!;
            let last = false;
            if (i == files.length - 1) last = true;
            await handleFile(item,last);
          }
          if (images.length + csvData.length == files.length + addedLength) {
            // done -- last to finish was not a csv, so continue.
            handleCallImport();
          }
        }
      } catch (err) {
        console.error('Error importing:', err);
        setDialogText("Error Importing from Files.");
        dialog.showModal();
      }


      //     reader.addEventListener("load", async (event) => {
      //       console.log("Read: " + reader.result as string);
      //       console.log("which is", reader.result);
      //       if (!data.includes(reader.result as string)) {
      //         data.push(reader.result as string);
      //       }
      //       if (data.length === files.length) {
      //         try {
      //           const response = await fetch(`http://${$ip}/api/csv/import`, {
      //             method: 'POST',
      //             headers: { 'Content-Type': 'application/json' },
      //             body: JSON.stringify({data: data}),
      //           });
      //           if (!response.ok) throw new Error('Error Importing from Files.');
      //           setDialogText("Files Imported Successfully!");
      //           dialog.showModal();
      //         } catch (err) {
      //           console.error('Error importing:', err);
      //           setDialogText("Error Importing from Files.");
      //           dialog.showModal();
      //         }
      //       }
      //     });
      //     reader.readAsText(item);
      //   }
      // } else {
      //   setDialogText("Only Two Files can be Imported.\nOne with the templates and another with the items.");
      //   dialog.showModal();
      // }
    }

  async function handleCallImport() {
    try {
      console.log(files);
      console.log(images);
      console.log(csvData);
      console.log(addedLength);
      const response = await fetch(`http://${$ip}/api/csv/import`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({data: csvData}),
      });
      if (!response.ok) throw new Error('Error Importing from Files.');
        setDialogText("Files Imported Successfully!");
        dialog.showModal();
      } catch (err) {
        console.error('Error importing:', err);
        setDialogText("Error Importing from Files.");
        dialog.showModal();
      }
  }

  async function handleExport() {
      try {
        const responseT = await fetch(`http://${$ip}/api/templates/getTemplates`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        });
        if (!responseT.ok) throw new Error('Failed to fetch templates');
        let templates : ITemplatePopulated[] = [];
        const dataT = await responseT.json();
        templates = dataT as ITemplatePopulated[];

        const responseI = await fetch(`http://${$ip}/api/items/search?name=${encodeURIComponent("")}`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        });
        if (!responseI.ok) throw new Error('Failed to fetch items');
        let items = [];
        const dataI = await responseI.json();
        items = dataI as IBasicItemPopulated[];
        console.log("Fetched Items for Export:", items);
        const itemRoot = items.filter(item => {return item.parentItem == null});

        const formatter = new CSVFormatterPopulated(items, templates, itemRoot);//>templateMap);
        const templateContent = formatter.formatTemplates();
        const itemContent = formatter.formatItems();

        if (!itemInput) {
          itemInput = "items";
        }
        if (!templateInput) {
          templateInput = "templates";
        }

        downloadFile(itemInput, itemContent);
        downloadFile(templateInput, templateContent);

        itemInput = "";
        templateInput = "";

        setDialogText("Data Exported Successfully!");
        dialog.showModal();
      } catch (err) {
        console.error('Error exporting:', err);
        setDialogText("Error Exporting to Files.");
        dialog.showModal();
      }
    }
  

    function handleImportImages(item: File) {
      console.log("I1");
      images.push(item);
    }


    function handleImportCSV(item: File, last: boolean) {
        const reader = new FileReader();
        reader.addEventListener("load", () => {
          if (!csvData.includes(reader.result as string)) {
              csvData.push(reader.result as string);
          }
          if (last) {
            // make call here
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
        let blobs : Promise<Blob>[] = [];
        let objs : JSZip.JSZipObject[] = [];
        unzipped.forEach((path, obj) => {
          i++;
          if (!obj.dir) {
            objs.push(obj);
            addedLength++;
            blobs.push(obj.async('blob'));
          }
        });
        const loadedBlobs = await Promise.all(blobs);
        for (var i = 0; i < loadedBlobs.length; i++) {
          const file =new File([loadedBlobs[i]],objs[i].name, {lastModified: objs[i].date.getTime()});
          await handleFile(file, last && i == loadedBlobs.length-1);
        }
    }
</script>
  
  <AppBar class="appbar-border glass"> 
    <button class="back-button" on:click={goBack}>
      ⬅ Back 
    </button>
  </AppBar>

  <div class="body utility-body">
    <div class="utility-col">
      <label for="many">Select CSV Files:</label>
      <input accept=".csv,image/png,image/jpeg,.zip" bind:files id="many" multiple type="file">
      <button on:click={handleSelected}>Import From CSV</button>
    </div>

    <div class="utility-col">
      <label for="itemCSVName">Title of Item CSV:</label>
      <input type="text" id="itemCSVName" bind:value={itemInput}> 
      <label for="templateCSVName">Title of Template CSV:</label>
      <input type="text" id="templateCSVName" bind:value={templateInput}>
      <button on:click={handleExport}>Export To CSV</button>
    </div>

  </div>

  <Dialog
    bind:dialog={dialog}>
    <div id="dialog-text" class="simple-dialog-spacing" > 
      Some dialog text  
    </div>
  </Dialog>
  
    