import type { Request, Response } from 'express';
// import { ParserManager } from '../utility/parsing/ParserManager.js';
// import { FileExporter } from '../utility/file/FileExporter.js';

export const debug = async (req: Request, res: Response) => {
  // try {
  //   console.log("debug did");
  //   return res.status(201).json({message: 'did'});
  // } catch (err) {
  //   console.error('Error in debug:', err);
  //   return res.status(500).json({ message: 'Error in debug', error: err });
  // }
  //res.status(201).json({message: "No"});
  res.send("Yes");
};

// export const importFromFile = async (req: Request, res: Response) => {
//     try {
//       const filePaths : string[] = req.body.filePaths;

//       if (!filePaths || filePaths.length > 2 || filePaths.length < 1) {
//         return res.status(400).json({message : 'File path(s) are required and at most two can be specified.'});
//       }

//       const parser = new ParserManager()//templates); // TODO: fix
//       await parser.parseFromFiles(filePaths);
//       return res.status(201).json({message: 'Successfully imported from file path(s).'});
//     } catch (err) {
//       console.error('Error importing from file(s):', err);
//       return res.status(500).json({ message: 'Error importing from file(s)', error: err });
//     }
//   };

// export const exportToFolder = async (req: Request, res: Response) => {
//     try {
//         const filePaths : string[] = req.body.filePaths;
//         const data : string = req.body.data;
//         const templateData : string = req.body.templateData;
//         let folder : string = req.body.folder;
  
//         if (!filePaths || filePaths.length > 2 || filePaths.length < 1) {
//           return res.status(400).json({message : 'File path(s) are required and at most two can be specified.'});
//         }

//         if ((!data || data.length == 0) && filePaths[0] !== "") {
//             return res.status(400).json({message : 'Item data is required to export when given a item file path.'});
//         }

//         if ((!templateData || templateData.length == 0) && filePaths.length == 2 && filePaths[2] !== "") {
//             return res.status(400).json({message : 'Template data is required to export when given a template file path.'});
//         }

//         if (!folder || folder.length == 0) {
//             // use a default folder
//             folder = "../out";
//         }

//         if (!!data) {
//             FileExporter.export(filePaths[0], folder, data);
//         }
//         if (!!templateData) {
//             FileExporter.export(filePaths[1], folder, templateData);
//         }
//         return res.status(201).json({message: 'Successfully exported data to file path(s).'});
//       } catch (err) {
//         console.error('Error exporting data to file(s):', err);
//         return res.status(500).json({ message: 'Error exporting data', error: err });
//       }
// };
