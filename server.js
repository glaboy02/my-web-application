import express from 'express';
import fetch from 'node-fetch';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import session from 'express-session';
import PouchDB from 'pouchdb';
import PouchFind from 'pouchdb-find';

dotenv.config();
PouchDB.plugin(PouchFind);

const app = express();
const port = 3260;
const db = new PouchDB('bookmarks');

app.use(cors());
app.use(express.json());
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true
}));

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.static(path.join(__dirname, 'src/frontend')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'src/frontend', 'index.html'));
});

app.post('/api/anilist', async (req, res) => {
    try {
        const headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        };

        if (req.session.token) {
            headers['Authorization'] = `Bearer ${req.session.token}`;
        }

        const response = await fetch('https://graphql.anilist.co', {
            method: 'POST',
            headers,
            body: JSON.stringify(req.body),
        });

        const data = await response.json();
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching data from AniList' });
    }
});

app.post('/api/bookmarks', async (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    const { animeId, animeData, status = 'none' } = req.body;
    const docId = `${req.session.user.id}_${animeId}`;
    try {
        const existingDoc = await db.get(docId).catch(err => null);
        if (existingDoc) {
            return res.status(409).json({ error: 'Bookmark already exists' });
        }
        const doc = {
            _id: docId,
            userId: req.session.user.id,
            animeId,
            animeData,
            status
        };
        await db.put(doc);
        res.json(doc);
    } catch (error) {
        res.status(500).json({ error: 'Error saving bookmark' });
    }
});

app.get('/api/bookmarks', async (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    try {
        const result = await db.find({ selector: { userId: req.session.user.id } });
        res.json(result.docs);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching bookmarks' });
    }
});

app.get('/api/bookmarks/:animeId', async (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    try {
        const docId = `${req.session.user.id}_${req.params.animeId}`;
        const doc = await db.get(docId);
        res.json(doc);
    } catch (error) {
        if (error.status === 404) {
            res.status(404).json({ error: 'Bookmark not found' });
        } else {
            console.error('Error fetching bookmark:', error);
            res.status(500).json({ error: 'Error fetching bookmark' });
        }
    }
});

app.put('/api/bookmarks/:animeId', async (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    try {
        const { status } = req.body;
        const docId = `${req.session.user.id}_${req.params.animeId}`;
        const doc = await db.get(docId);
        doc.status = status;
        await db.put(doc);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Error updating bookmark' });
    }
});

app.delete('/api/bookmarks/:animeId', async (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    try {
        const docId = `${req.session.user.id}_${req.params.animeId}`;
        const doc = await db.get(docId);
        await db.remove(doc);
        res.json({ success: true });
    } catch (error) {
        if (error.status === 404) {
            res.status(404).json({ error: 'Bookmark not found' });
        } else {
            console.error('Error deleting bookmark:', error);
            res.status(500).json({ error: 'Error deleting bookmark' });
        }
    }
});

app.get('/auth/anilist', (req, res) => {
    const redirectUri = encodeURIComponent(`http://localhost:${port}/auth/anilist/callback`);
    res.redirect(`https://anilist.co/api/v2/oauth/authorize?client_id=${process.env.ANILIST_CLIENT_ID}&response_type=code&redirect_uri=${redirectUri}`);
});

app.get('/auth/anilist/callback', async (req, res) => {
    const { code } = req.query;
    try {
        const tokenResponse = await fetch('https://anilist.co/api/v2/oauth/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                grant_type: 'authorization_code',
                client_id: process.env.ANILIST_CLIENT_ID,
                client_secret: process.env.ANILIST_CLIENT_SECRET,
                redirect_uri: `http://localhost:${port}/auth/anilist/callback`,
                code,
            }),
        });
        const tokenData = await tokenResponse.json();
        req.session.token = tokenData.access_token;

        const userResponse = await fetch('https://graphql.anilist.co', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${tokenData.access_token}`,
            },
            body: JSON.stringify({
                query: `
                    query {
                        Viewer {
                            id
                            name
                            
                        }
                    }
                `,
            }),
        });
        const userData = await userResponse.json();
        req.session.user = userData.data.Viewer;

        res.redirect('/');
    } catch (error) {
        console.error('Error fetching access token:', error);
        res.redirect('/?error=token_error');
    }
});

app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/');
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
