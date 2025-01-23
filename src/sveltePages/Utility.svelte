<script lang="ts">
   import { AppBar } from '@skeletonlabs/skeleton';
    import '../svelteStyles/main.css';
    import { ip } from '../stores/ipStore';
    import type { IBasicItemPopulated } from '../models/basicItem';
    import { CSVFormatterPopulated } from '../utility/formating/CSVFormatterPopulated.js';
    import type { ITemplatePopulated } from '../models/template';
    import Dialog from '../svelteComponents/Dialog.svelte';
    //import { Types } from 'mongoose';

    let files : FileList;
    let dialog: HTMLDialogElement;

    function goBack() {
      window.history.back();
    }//we gonna change this later fr fr

    function setDialogText(text: string) {
      document.getElementById("dialog-text")!.innerText = text;
    }

    async function handleSelected() {
      console.log(files);
      if (files) {
        console.log(files.length);
      } else {
        console.error("handle called when nothing selected.");
        return;
      }
      if (files.length <= 2) {
        const reader = new FileReader();
        let data : string[] = [];
        for (var i = 0; i < files.length; i++) {
          const item = files.item(i)!;
          console.log(files[i]);
          console.log(item);
          reader.addEventListener("load", async () => {
            console.log(reader.result);
            data.push(reader.result as string);
            if (data.length === files.length) {
              try {
                const response = await fetch(`http://${$ip}/api/csv/import`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({data: data}),
                });
                console.log(response);
                setDialogText("Files Imported Successfully!");
                dialog.showModal();
              } catch (err) {
                console.error('Error importing:', err);
                setDialogText("Error Importing from Files.");
                dialog.showModal();
              }
            }
          });
          reader.readAsText(item);
        }
      } else {
        setDialogText("Only Two Files can be Imported.\nOne with the templates and another with the items.");
        dialog.showModal();
        // show pop up error
        // TODO: show error
      }
    }

    async function handleExport() {
      try {
      let itemCSVName = document.getElementById("itemCSVName")?.textContent;
      let templateCSVName = document.getElementById("templateCSVName")?.textContent;
      if (!itemCSVName) {
        itemCSVName = "items";
      }
      if (!templateCSVName) {
        templateCSVName = "templates";
      }

      const responseT = await fetch(`http://${$ip}/api/templates/getTemplates`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!responseT.ok) throw new Error('Failed to fetch templates');
      let templates : ITemplatePopulated[] = [];
      const dataT = await responseT.json();
      templates = dataT as ITemplatePopulated[];
      //let templateMap = new Map<Types.ObjectId, ITemplatePopulated>(); // The bad line!!!
      // templates.forEach(template => templateMap.set(template.id, template));

      const responseI = await fetch(`http://${$ip}/api/items/search?name=${encodeURIComponent("")}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!responseI.ok) throw new Error('Failed to fetch items');
      let items = [];
      const dataI = await responseI.json();
      items = dataI as IBasicItemPopulated[];
      const itemRoot = items.filter(item => item.parentItem === null);

      const formatter = new CSVFormatterPopulated(items, templates, itemRoot);//>templateMap);
      const templateContent = formatter.formatTemplates();
      const itemContent = formatter.formatItems();


          const response = await fetch(`http://${$ip}/api/csv/export`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              filePaths: [itemCSVName, templateCSVName],
              data: itemContent,
              templateData: templateContent,
              folder: "../out",
            }),
          });
          const res = await response.json();
          if (!res.ok) throw new Error('Error when writing formatted data.');
          setDialogText("Data Exported Successfully!");
          dialog.showModal();
        } catch (err) {
          console.error('Error exporting:', err);
          setDialogText("Error Exporting to Files.");
          dialog.showModal();
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
      <input accept=".csv" bind:files id="many" multiple type="file">
      <button on:click={handleSelected}>Import From CSV</button>
    </div>

    <div class="utility-col">
      <label for="itemCSVName">Title of Item CSV:</label>
      <input type="text" id="itemCSVName"> 
      <label for="templateCSVName">Title of Template CSV:</label>
      <input type="text" id="templateCSVName">
      <button on:click={handleExport}>Export To CSV</button>
    </div>

  </div>

  <Dialog class="popover"
    bind:dialog={dialog}>
    <div id="dialog-text" class="simple-dialog-spacing" > 
      Some dialog text  
    </div>
  </Dialog>
  
    