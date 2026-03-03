require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');
const { testConnessione } = require('./config/database');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true }));

// File statici (frontend)
app.use(express.static(path.join(__dirname, '..', 'public')));

// Routes API
app.use('/api/auth', require('./routes/auth'));
app.use('/api/rivenditori', require('./routes/rivenditori'));
app.use('/api/preventivi', require('./routes/preventivi'));
app.use('/api/listino', require('./routes/listino'));
app.use('/api/utenti', require('./routes/utenti'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/admin/listino', require('./routes/listino_admin'));

// Route di health check
app.get('/api/health', (req, res) => {
    res.json({ stato: 'ok', versione: '1.1.0' });
});

// Fallback: serve index.html per le route non-API (SPA)
app.use((req, res, next) => {
    if (!req.path.startsWith('/api') && req.method === 'GET') {
        return res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
    }
    next();
});

// Avvio server
async function avvia() {
    const dbConnesso = await testConnessione();
    if (!dbConnesso) {
        console.warn('ATTENZIONE: Database non raggiungibile. Il server partirà comunque.');
        console.warn('Configura DATABASE_URL nel file .env');
    }

    app.listen(PORT, () => {
        console.log(`Server Preventivatore avviato su http://localhost:${PORT}`);
        console.log(`Ambiente: ${process.env.NODE_ENV || 'development'}`);
    });
}

avvia();
