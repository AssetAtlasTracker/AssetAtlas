import express from 'express';
import connectDB from './config/mongoConnection';

const app = express();
const PORT = process.env.PORT || 3000;

connectDB();

app.use(express.json()); // Middleware to handle JSON

app.get('/', (req, res) => {
  res.send('API is running...');
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});