import type { Request, Response } from 'express';
import { FileExporter } from '../utility/file/FileExporter.js';
import { ParserManager } from '../utility/parsing/ParserManager.js';
import type { GridFSFile } from '../controllers/itemController.js';

export const importFromFile = async (req: Request, res: Response) => {
    try {
      const data = req.body.data as string[]; // note : first entry will be ""
      const files = req.files as unknown as GridFSFile[];
      const ids = files.map(file => {return file.id});
      if (ids.includes(undefined)) {
        throw new Error("Error failed to get id of uploaded image.");
      }
      const knownIds = ids.filter(ele => {return ele != undefined});

      if (!data || data.length-1 > 2 || data.length-1 < 1) {
        res.status(400).json({message : 'File path(s) are required and at most two can be specified.'});
        return;
      }

      let names : string[] = [];
      if (files.length > 1) {
        names = (req.body.names as string[]).map(name => {return name.toLowerCase()});
      } else if (files.length == 1) {
        names = [req.body.names.toLowerCase()];
      }
      const parser = new ParserManager();
      await parser.parseFromFiles(data.slice(1), names, knownIds);
      res.status(201).json({message: 'Successfully imported from file path(s).'});
    } catch (err) {
      console.error('Error importing from file(s):', err);
      res.status(500).json({ message: 'Error importing from file(s)', error: err });
    }
};

export const exportToFolder = async (req: Request, res: Response) => {
    try {
        const filePaths : string[] = req.body.filePaths;
        const data : string = req.body.data;
        const templateData : string = req.body.templateData;
        let folder : string = req.body.folder;
  
        if (!filePaths || filePaths.length > 2 || filePaths.length < 1) {
          res.status(400).json({message : 'File path(s) are required and at most two can be specified.'});
          return;
        }

        if ((!data || data.length == 0) && filePaths[0] !== "") {
            res.status(400).json({message : 'Item data is required to export when given a item file path.'});
            return;
        }

        if (!folder || folder.length == 0) {
            // use a default folder
            folder = "../out";
        }
        const exporter = new FileExporter();
        let itemMessage = "";
        let templateMessage = ""; 

        if (data) {
          itemMessage = await exporter.export(filePaths[0], folder, data);
        }
        if (templateData) {
          templateMessage = await exporter.export(filePaths[1], folder, templateData);
        }

        if (itemMessage.toLowerCase().includes("error")) {
          throw new Error(itemMessage);
        }
        if (templateMessage.toLowerCase().includes("error")) {
          throw new Error(templateMessage);
        }

        res.status(201).json({message: 'Successfully exported data to file path(s).'});
      } catch (err) {
        console.error('Error exporting data to file(s):', err);
        res.status(500).json({ message: 'Error exporting data', error: err });
      }
};
