import express from 'express';
import mongoose from 'mongoose';
import { fileURLToPath } from 'url';
import path, { dirname } from 'path';
import cors from 'cors';
import fs from 'fs';//for modern .env access
import templateRoutes from './routes/templateRoutes.js';
import customFieldRoutes from './routes/customFieldRoutes.js';
import connectDB from './config/mongoConnection.js';
import { gridFsReady } from './config/gridfs.js';
import itemRoutes from './routes/itemRoutes.js';
import recentItemsRoutes from './routes/recentItemsRoutes.js';
import csvRoutes from "./routes/csvRoutes.js";

const app = express();
//const PORT = process.env.PORT || 3000;
const PORT = parseInt(process.env.PORT || '3000', 10);

//frontend zone V
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);


console.log('connectDB() about to call mongoose.connect...');
await connectDB();
console.log('connectDB() finished connecting!');
console.log('Mongoose connected DB name:', mongoose.connection.db?.databaseName);

// Wait for GridFS to be ready before setting up routes
await gridFsReady;
console.log('GridFS initialization completed');

//CORS
const allowedOrigins = [
  'http://localhost:3000', //Allow localhost
  'http://localhost:3001', //screwing around with dev hosting with vite
  `http://${process.env.IP}`, //Allow the IP from .env or dynamically
];

app.use(cors({
  origin: allowedOrigins,
  credentials: true,  //Allow credentials if needed
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
  let ip = 'localhost:3000';//default to 3k
  //let ip = 'localhost:3000';//proper default
  
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

app.use('/api/items', itemRoutes); //use routes after upload is ready
app.use('/api/templates', templateRoutes);
app.use('/api/customFields', customFieldRoutes);
app.use('/api/csv', csvRoutes);
app.use('/api/recentItems', recentItemsRoutes);

// app.get('/', (req, res) => {
//   res.send('API is running...');
// });

app.use(express.static(path.join(__dirname, '../dist')));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist', 'index.html'));
});


app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});