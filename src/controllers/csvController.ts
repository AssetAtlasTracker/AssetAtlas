import type { Request, Response } from 'express';
import { FileExporter } from '../utility/file/FileExporter.js';
import { ParserManager } from '../utility/parsing/ParserManager.js';

export const importFromFile = async (req: Request, res: Response) => {
    try {
      const data : string[] = req.body.data;

      if (!data || data.length > 2 || data.length < 1) {
        res.status(400).json({message : 'File path(s) are required and at most two can be specified.'});
        return;
      }
      const parser = new ParserManager();//templates); // TODO: fix
      await parser.parseFromFiles(data);
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

        // if ((!templateData || templateData.length == 0) && filePaths.length == 2 && filePaths[2] !== "") {
        //     res.status(400).json({message : 'Template data is required to export when given a template file path.'});
        //     return;
        // }

        if (!folder || folder.length == 0) {
            // use a default folder
            folder = "../out";
        }

        if (!!data) {
            FileExporter.export(filePaths[0], folder, data);
        }
        if (!!templateData) {
            FileExporter.export(filePaths[1], folder, templateData);
        }
        res.status(201).json({message: 'Successfully exported data to file path(s).'});
      } catch (err) {
        console.error('Error exporting data to file(s):', err);
        res.status(500).json({ message: 'Error exporting data', error: err });
      }
};
