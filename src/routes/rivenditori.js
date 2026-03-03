const express = require('express');
const Rivenditore = require('../models/rivenditore');
const { verificaToken, soloAdmin } = require('../middleware/auth');

const router = express.Router();

// Tutte le route richiedono autenticazione
router.use(verificaToken);

// GET /api/rivenditori — Lista rivenditori (solo admin) con paginazione
router.get('/', soloAdmin, async (req, res) => {
    try {
        const filtri = {};
        if (req.query.agenzia) filtri.agenzia = req.query.agenzia;
        if (req.query.cerca) filtri.cerca = req.query.cerca;

        // Paginazione
        if (req.query.per_pagina) {
            filtri.per_pagina = parseInt(req.query.per_pagina) || 20;
            filtri.pagina = parseInt(req.query.pagina) || 1;
        }

        const [rivenditori, totale] = await Promise.all([
            Rivenditore.lista(filtri),
            Rivenditore.contaConFiltri(filtri)
        ]);

        const perPagina = filtri.per_pagina || totale;
        const totalePagine = perPagina > 0 ? Math.ceil(totale / perPagina) : 1;

        res.json({
            dati: rivenditori,
            paginazione: {
                pagina: filtri.pagina || 1,
                per_pagina: perPagina,
                totale,
                totale_pagine: totalePagine
            }
        });
    } catch (err) {
        console.error('Errore lista rivenditori:', err);
        res.status(500).json({ errore: 'Errore interno del server' });
    }
});

// GET /api/rivenditori/agenzie — Lista agenzie distinte
router.get('/agenzie', soloAdmin, async (req, res) => {
    try {
        const agenzie = await Rivenditore.listaAgenzie();
        res.json(agenzie);
    } catch (err) {
        console.error('Errore lista agenzie:', err);
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

// DELETE /api/rivenditori/:id — Elimina rivenditore (solo admin)
router.delete('/:id', soloAdmin, async (req, res) => {
    try {
        const id = parseInt(req.params.id);

        const esistente = await Rivenditore.trovaPerId(id);
        if (!esistente) {
            return res.status(404).json({ errore: 'Rivenditore non trovato' });
        }

        // Verifica che non abbia preventivi associati
        const { pool } = require('../config/database');
        const { rows } = await pool.query(
            'SELECT COUNT(*) as totale FROM preventivi WHERE rivenditore_id = $1',
            [id]
        );
        if (parseInt(rows[0].totale) > 0) {
            return res.status(400).json({
                errore: `Impossibile eliminare: il rivenditore ha ${rows[0].totale} preventiv${rows[0].totale === '1' ? 'o' : 'i'} associati`
            });
        }

        await Rivenditore.elimina(id);
        res.json({ messaggio: 'Rivenditore eliminato' });
    } catch (err) {
        console.error('Errore eliminazione rivenditore:', err);
        res.status(500).json({ errore: 'Errore interno del server' });
    }
});

module.exports = router;
