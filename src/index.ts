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

function getEnvVariables(envPath: string) {
  const envData = fs.readFileSync(envPath, 'utf-8');
  const envVars: { [key: string]: string } = {};
  envData.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
      envVars[key.trim()] = value.trim().replace(/\r$/, '');
    }
  });
  return envVars;
}

//Cache IP at startup, this makes it work better
const envPath = path.join(__dirname, '../docker', '.env');
let cachedIp = 'localhost:3000';
try {
  const envVars = getEnvVariables(envPath);
  cachedIp = envVars['IP'] || cachedIp;
  console.log('Cached IP at startup:', cachedIp);
} catch (error) {
  console.error('Error reading .env file during startup:', error);
}

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

app.get('/api/ip', (req, res) => {
  res.json({ ip: cachedIp });
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