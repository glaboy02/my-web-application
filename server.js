import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import animeRoutes from './routes/anime.mjs';

const app = express();
const PORT = process.env.PORT || 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.json());
app.use(express.static(path.join(__dirname, 'src/frontend'))); // Serve static files from 'src/frontend'
app.use('/api', animeRoutes); // Mount the anime routes at /api

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
