import express from 'express';
import mongoose from 'mongoose';
import { fileURLToPath } from 'url';
import path, { dirname } from 'path';
import cors from 'cors';
import fs from 'fs';//for modern .env access
//import { createItem, getItemById } from './mongooseQueries';
//import * as mongooseQueries from './mongooseQueries.js';
//import BasicItem from './models/basicItem.js';
import itemRoutes from './routes/itemRoutes.js';
import templateRoutes from './routes/templateRoutes.js';

const app = express();
//const PORT = process.env.PORT || 3000;
const PORT = parseInt(process.env.PORT || '3000', 10);

//frontend zone V
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);



export default function connectDB() {
  const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/mydatabase';
  
  mongoose.connect(mongoURI)
    .then(() => console.log('MongoDB connected'))
    .catch((err) => console.error('MongoDB connection error:', err));
}

//cors
// const cors = require('cors');
// const allowedOrigins = [`http://${process.env.IP}`];//we can probably get rid of this maybe
// app.use(cors({
//   origin: allowedOrigins,
//   credentials: true,  // Allow credentials if needed
// }));
//cors

connectDB();


//CORS
const allowedOrigins = [
  'http://localhost:3000', // Allow localhost
  `http://${process.env.IP}`, // Allow the IP from .env or dynamically
];

 app.use(cors({
   origin: allowedOrigins,
   credentials: true,  // Allow credentials if needed
 }));


app.use(express.json());

function getEnvVariables(envPath: string) {//for .env stuff
  const envData = fs.readFileSync(envPath, 'utf-8');
  const envVars: { [key: string]: string } = {};
  
  // Split into lines and process each key-value pair
  envData.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
      envVars[key.trim()] = value.trim().replace(/\r$/, '');//trimming
    }
  });
  
  return envVars;
}


app.get('/api/ip', (req, res) => {
  const envPath = path.join(__dirname, '../docker', '.env');
  console.log('ENV Path:', envPath);
  let ip = 'localhost:666';//defaul to 3k
  //let ip = 'localhost:3000';//proper defaukl
  
  //if (fs.existsSync(envPath)) {
    try {
    const envVars = getEnvVariables(envPath);
    console.log('Parsed envVars:', envVars);
    ip = envVars['IP'] || ip;
    console.log('IP from .env:', ip);
  } catch (error) {
    console.error('Error reading .env file:', error);
    return res.status(500).json({ error: 'Failed to read .env file' });
  }
//}
  res.json({ ip });
});


// Serve static files from the DIST directory (NOT PUBLIC I HATE YOU PUBLIC AAAAAAAAA!!! lololol)

//app.use(express.json()); // Middleware to handle JSON

// app.post('/item', async (req, res) =>{
//   const {name, description, tags} = req.body;
//   try {
//     console.log('Received request:', req.body);
//     const newItem = await mongooseQueries.createItem(name, description, tags);
//     res.status(201).json(newItem); //201 is https standard dont worry about it blud
//   } catch (err) {
//     console.error('Error details:', err);
//     res.status(500).json({message: 'Error creating item', error: err });
//   } 
// });

// app.get('/item/:id', async (req, res) => {
//   const { id } = req.params;
// if(!mongoose.Types.ObjectId.isValid(id)) {
//   return res.status(400).json({message: "not a valid mongodb ID"});
// }

//   try {
//     const item = await mongooseQueries.getItemById(id);
//     if (item) {
//       res.status(200).json(item);//standard number
//     } else {
//       res.status(404).json({ message: 'Cannot get: Item not found' });
//     }
//   } catch (err) {
//     res.status(500).json({ message: 'Error fetching item', error: err });
//   }
// });

// app.delete('/item/:id', async (req, res) => {
//   const { id } = req.params;
// if(!mongoose.Types.ObjectId.isValid(id)) {
//   return res.status(400).json({message: "not a valid mongodb ID"});
// }

//   try {
//     const item = await mongooseQueries.deleteItemById(id);
//     if (item) {
//       return res.status(200).json({ message: 'Item deleted successfully', item });
//     } else {
//       res.status(404).json({ message: 'Cannot delete: Item not found' });
//     }
//   } catch (err) {
//     res.status(500).json({ message: 'Error deleting item', error: err });
//   }
// });

// app.get('/items/search', async (req, res) => {
//   const { name } = req.query;
//   const query = name ? { name: { $regex: name, $options: 'i' } } : {};

//   try {
//     const items = await BasicItem.find(query).exec();
//     res.setHeader('Content-Type', 'application/json');
//     res.status(200).json(items);
//   } catch (error) {
//     console.error('Error during search:', error);
//     res.status(500).json({ error: 'Failed to search items' });
//   }
// });

// app.listen(PORT, () => {
//   console.log(`Server running on port ${PORT}`);
// });

app.use('/api/items', itemRoutes);
app.use('/api/templates', templateRoutes);

app.use(express.static(path.join(__dirname, '../dist')));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist', 'index.html'));
});

app.get('/', (req, res) => {
  res.send('API is running...');
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});