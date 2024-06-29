import { Router } from 'express';

const router = Router();

let animeList = []; // Sample data store

// Create (POST)
router.post('/anime', (req, res) => {
  const newAnime = req.body;
  const existingAnime = animeList.find(a => a.id === newAnime.id);
  if (existingAnime) return res.status(400).json({ message: 'Anime already exists' });

  animeList.push(newAnime);
  res.status(201).json({ message: 'Anime created', anime: newAnime });
});

// Read (GET)
router.get('/anime', (req, res) => {
  res.status(200).json(animeList);
});

router.get('/anime/:id', (req, res) => {
  const anime = animeList.find(a => a.id === parseInt(req.params.id));
  if (!anime) return res.status(404).json({ message: 'Anime not found' });
  res.status(200).json(anime);
});

// Update (PUT)
router.put('/anime/:id', (req, res) => {
  const anime = animeList.find(a => a.id === parseInt(req.params.id));
  if (!anime) return res.status(404).json({ message: 'Anime not found' });

  Object.assign(anime, req.body);
  res.status(200).json({ message: 'Anime updated', anime });
});

// Delete (DELETE)
router.delete('/anime/:id', (req, res) => {
  const animeIndex = animeList.findIndex(a => a.id === parseInt(req.params.id));
  if (animeIndex === -1) return res.status(404).json({ message: 'Anime not found' });

  animeList.splice(animeIndex, 1);
  res.status(200).json({ message: 'Anime deleted' });
});

export default router;
