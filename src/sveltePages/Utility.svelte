<script lang="ts">
    import { AppBar } from '@skeletonlabs/skeleton';
    import '../svelteStyles/view.css';
    import '../svelteStyles/home.css';
    import '../svelteStyles/main.css';
    //import { ParserManager } from '../utility/parsing/ParserManager';
    import { ip } from '../stores/ipStore';
    import type { ITemplatePopulated } from '../models/template';
    import type { IBasicItemPopulated } from '../models/basicItem';
    import { Types } from 'mongoose';
    import { CSVFormatterPopulated } from '../utility/formating/CSVFormatterPopulated';
    //import { FileExporter } from '../utility/file/FileExporter';

    let files : FileList;
  
    function goBack() {
      window.history.back();
    }//we gonna change this later fr fr

    function handleImport() {
      document.getElementById("many")?.click();
    }

    async function handleSelected() {
      console.log(files.length);
      if (files.length <= 2) {
        // valid
        let filePaths : string[] = [];
        for (var i = 0; i < files.length; i++) {
          filePaths[i] = files.item(i)!.webkitRelativePath;
        }
        
        //const parser = new ParserManager()//templates); // TODO: fix
        //parser.parseFromFiles(filePaths);
      } else {
        // show pop up error
        // TODO: show error
      }
    }

    async function handleExport() {
      const responseT = await fetch(`http://${$ip}/api/templates/getTemplates`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!responseT.ok) throw new Error('Failed to fetch templates');
      let templates = []
      const dataT = await responseT.json();
      templates = dataT as ITemplatePopulated[];
      let templateMap = new Map<Types.ObjectId, ITemplatePopulated>();
      templates.forEach(template => templateMap.set(template.id, template));

      const responseI = await fetch(`http://${$ip}/api/items/search?name=${encodeURIComponent("")}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!responseI.ok) throw new Error('Failed to fetch items');
      let items = [];
      const dataI = await responseI.json();
      items = dataI as IBasicItemPopulated[];
      let itemMap = new Map<Types.ObjectId, IBasicItemPopulated>();
      items.forEach(item => itemMap.set(item._id, item));
      const itemRoot = items.filter(item => item.parentItem === null);

      const formatter = new CSVFormatterPopulated(itemMap, templateMap);
      const templateContent = formatter.formatTemplates(templates);
      const itemContent = formatter.formatItems(itemRoot, itemMap);

      //FileExporter.export("templates", "../out", templateContent.toString());
      //FileExporter.export("items", "../out", itemContent.toString());
    }
  </script>
  
  <AppBar class="appbar-border glass"> 
    <button class="back-button" on:click={goBack}>
      ⬅ Back 
    </button>
  </AppBar>

  <div class="body">
    <button on:click={handleImport}>Import From CSV</button>
    <input accept=".csv" bind:files id="many" multiple type="file" on:input={handleSelected}>

    <button on:click={handleExport}>Export To CSV</button>
    <input type="text">
  </div>
  
  
    