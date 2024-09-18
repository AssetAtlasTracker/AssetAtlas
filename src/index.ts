import express from 'express';
import mongoose from 'mongoose';
import { createItem, getItemById } from './mongooseQueries';

const app = express();
const PORT = process.env.PORT || 3000;

export default function connectDB() {
  const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/mydatabase';
  
  mongoose.connect(mongoURI)
    .then(() => console.log('MongoDB connected'))
    .catch((err) => console.error('MongoDB connection error:', err));
}

connectDB();

app.use(express.json()); // Middleware to handle JSON

app.get('/', (req, res) => {
  res.send('API is running...');
});

app.post('/item', async (req, res) =>{
  const {name, description, tags} = req.body;
  try {
    const newItem = await createItem(name, description, tags);
    res.status(201).json(newItem); //201 is https standard dont worry about it blud
  } catch (err) {
    res.status(500).json({message: 'Error creating item', error: err });
  } 
});

app.get('/item/:id', async (req, res) => {
  const id = parseInt(req.params.id, 10);
  try {
    const item = await getItemById(id);
    if (item) {
      res.status(200).json(item);//standard number
    } else {
      res.status(404).json({ message: 'Item not found' });
    }
  } catch (err) {
    res.status(500).json({ message: 'Error fetching item', error: err });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});