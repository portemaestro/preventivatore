const express = require('express');
const Rivenditore = require('../models/rivenditore');
const { verificaToken, soloAdmin } = require('../middleware/auth');

const router = express.Router();

// Tutte le route richiedono autenticazione
router.use(verificaToken);

// GET /api/rivenditori — Lista rivenditori (solo admin)
router.get('/', soloAdmin, async (req, res) => {
    try {
        const filtri = {};
        if (req.query.agenzia) filtri.agenzia = req.query.agenzia;
        if (req.query.cerca) filtri.cerca = req.query.cerca;

        const rivenditori = await Rivenditore.lista(filtri);
        res.json(rivenditori);
    } catch (err) {
        console.error('Errore lista rivenditori:', err);
        res.status(500).json({ errore: 'Errore interno del server' });
    }
});

// GET /api/rivenditori/:id — Dettaglio rivenditore (admin o proprietario)
router.get('/:id', async (req, res) => {
    try {
        const id = parseInt(req.params.id);

        // I rivenditori possono vedere solo il proprio profilo
        if (req.utente.ruolo !== 'admin' && req.utente.rivenditore_id !== id) {
            return res.status(403).json({ errore: 'Accesso non autorizzato' });
        }

        const rivenditore = await Rivenditore.trovaPerId(id);
        if (!rivenditore) {
            return res.status(404).json({ errore: 'Rivenditore non trovato' });
        }

        res.json(rivenditore);
    } catch (err) {
        console.error('Errore dettaglio rivenditore:', err);
        res.status(500).json({ errore: 'Errore interno del server' });
    }
});

// POST /api/rivenditori — Crea rivenditore (solo admin)
router.post('/', soloAdmin, async (req, res) => {
    try {
        const { ragione_sociale } = req.body;

        if (!ragione_sociale || !ragione_sociale.trim()) {
            return res.status(400).json({ errore: 'Ragione sociale obbligatoria' });
        }

        const rivenditore = await Rivenditore.crea(req.body);
        res.status(201).json(rivenditore);
    } catch (err) {
        console.error('Errore creazione rivenditore:', err);
        res.status(500).json({ errore: 'Errore interno del server' });
    }
});

// PUT /api/rivenditori/:id — Modifica rivenditore (solo admin)
router.put('/:id', soloAdmin, async (req, res) => {
    try {
        const id = parseInt(req.params.id);

        const esistente = await Rivenditore.trovaPerId(id);
        if (!esistente) {
            return res.status(404).json({ errore: 'Rivenditore non trovato' });
        }

        const aggiornato = await Rivenditore.aggiorna(id, req.body);
        res.json(aggiornato);
    } catch (err) {
        console.error('Errore aggiornamento rivenditore:', err);
        res.status(500).json({ errore: 'Errore interno del server' });
    }
});

module.exports = router;
