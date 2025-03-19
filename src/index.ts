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
  try {
    const envData = fs.readFileSync(envPath, 'utf-8');
    const envVars: { [key: string]: string } = {};
    envData.split('\n').forEach(line => {
      const [key, value] = line.split('=');
      if (key && value) {
        envVars[key.trim()] = value.trim().replace(/\r$/, '');
      }
    });
    return envVars;
  } catch (error) {
    console.error('Error reading .env file:', error);
    return {};
  }
}

//Cache IP at startup, this makes it work better
const envPath = path.join(__dirname, '../docker', '.env');
let cachedIp: string = 'localhost:3000'; //fallback

try {
  const envVars = getEnvVariables(envPath);
  if (envVars['IP']) {
    cachedIp = envVars['IP'];
    console.log('Cached IP at startup:', cachedIp);
  } else {
    console.warn('IP not defined in .env, using default:', cachedIp);
  }
} catch (error) {
  console.error('Error processing IP from .env:', error);
  console.warn('Using default IP:', cachedIp);
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
  `http://${cachedIp}`, //Allow the IP from .env or dynamically
];

//dynamic detection of client origin for better CORS handling
app.use((req, res, next) => {
  const origin = req.headers.origin as string;
  if (origin && !allowedOrigins.includes(origin)) {
    console.log(`Adding new origin to CORS whitelist: ${origin}`);
    allowedOrigins.push(origin);
  }
  next();
});

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));

app.use(express.json());

app.get('/api/ip', (req, res) => {
  try {
    const envVars = getEnvVariables(envPath);
    if (!envVars['IP']) {
      throw new Error("IP not defined in .env");
    }
    res.json({ ip: envVars['IP'] });
  } catch (error) {
    console.error('Error reading .env file on /api/ip:', error);
    res.status(500).json({ error: "Error reading IP" });
  }
});

app.use('/api/items', itemRoutes); //use routes after upload is ready
app.use('/api/templates', templateRoutes);
app.use('/api/customFields', customFieldRoutes);
app.use('/api/csv', csvRoutes);
app.use('/api/recentItems', recentItemsRoutes);

//Serve static assets from the dist folder
app.use(express.static(path.join(__dirname, '../dist')));

//Fallback: serve index.html for any unmatched routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});