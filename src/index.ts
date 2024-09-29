import express from 'express';
import mongoose from 'mongoose';
import { fileURLToPath } from 'url';
import path, { dirname } from 'path';
import * as mongooseQueries from './mongooseQueries.js';
import BasicItem from './models/basicItem.js';


const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10); //the 10 specifies we are base 10.
//yup.


//tailscale STUFF VVV
//tailscale STUFF ^^^

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default function connectDB() {
  const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/mydatabase';
  
  mongoose.connect(mongoURI)
    .then(() => console.log('MongoDB connected'))
    .catch((err) => console.error('MongoDB connection error:', err));
}

connectDB();

app.use(express.json()); // Middleware to handle JSON

app.use(express.static(path.join(__dirname, '../dist')));

// app.get('*', (req, res) => {
//   res.sendFile(path.join(__dirname, '../dist', 'index.html'));
// });

app.get('/items/search', async (req, res) => {
  const { name } = req.query;
  const query = name ? { name: { $regex: name, $options: 'i' } } : {};

  try {
    const items = await BasicItem.find(query).exec();
    res.setHeader('Content-Type', 'application/json');
    res.status(200).json(items);
  } catch (error) {
    console.error('Error during search:', error);
    res.status(500).json({ error: 'Failed to search items' });
  }
});

app.get('/', (req, res) => {
  res.send('API is running...');
});

app.post('/item', async (req, res) =>{
  const {name, description, tags} = req.body;
  try {
    const newItem = await mongooseQueries.createItem(name, description, tags);
    res.status(201).json(newItem); //201 is https standard dont worry about it blud
  } catch (err) {
    res.status(500).json({message: 'Error creating item', error: err });
  } 
});

app.get('/item/:id', async (req, res) => {
  const { id } = req.params;
if(!mongoose.Types.ObjectId.isValid(id)) {
  return res.status(400).json({message: "not a valid mongodb ID"});
}

  try {
    const item = await mongooseQueries.getItemById(id);
    if (item) {
      res.status(200).json(item);//standard number
    } else {
      res.status(404).json({ message: 'Cannot get: Item not found' });
    }
  } catch (err) {
    res.status(500).json({ message: 'Error fetching item', error: err });
  }
});

app.delete('/item/:id', async (req, res) => {
  const { id } = req.params;
if(!mongoose.Types.ObjectId.isValid(id)) {
  return res.status(400).json({message: "not a valid mongodb ID"});
}

  try {
    const item = await mongooseQueries.deleteItemById(id);
    if (item) {
      return res.status(200).json({ message: 'Item deleted successfully', item });
    } else {
      res.status(404).json({ message: 'Cannot delete: Item not found' });
    }
  } catch (err) {
    res.status(500).json({ message: 'Error deleting item', error: err });
  }
});

// app.use(express.static(path.join(__dirname, '../dist')));

 app.get('*', (req, res) => {
   res.sendFile(path.join(__dirname, '../dist', 'index.html'));
 });

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});