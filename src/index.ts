import express from 'express';
import mongoose from 'mongoose';
import { fileURLToPath } from 'url';
import path, { dirname } from 'path';
import cors from 'cors';
import fs from 'fs';//for modern .env access
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

connectDB();


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
  let ip = 'localhost:3000';//defaul to 3k
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

app.use('/api/items', itemRoutes);
app.use('/api/templates', templateRoutes);

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