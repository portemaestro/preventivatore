const express = require('express');
const { verificaToken, soloAdmin } = require('../middleware/auth');
const {
    leggiSezione, scriviSezione, listaSezioni,
    importaDaFile, listaBackup, ripristinaDaBackup,
    MAPPA_SEZIONI, NOMI_SEZIONI, GRUPPI, ICONE_GRUPPI
} = require('../utils/listino_db');

const router = express.Router();
router.use(verificaToken);
router.use(soloAdmin);

// GET /api/admin/listino/sezioni — Lista sezioni con metadati
router.get('/sezioni', async (req, res) => {
    try {
        const sezioni = await listaSezioni();
        res.json({ sezioni, gruppi: GRUPPI, icone_gruppi: ICONE_GRUPPI, nomi: NOMI_SEZIONI });
    } catch (err) {
        console.error('Errore lista sezioni listino:', err);
        res.status(500).json({ errore: 'Errore interno del server' });
    }
});

// GET /api/admin/listino/:sezione — Dati JSON sezione
router.get('/:sezione', async (req, res) => {
    try {
        const { sezione } = req.params;
        if (!MAPPA_SEZIONI[sezione]) {
            return res.status(400).json({ errore: 'Sezione non valida' });
        }

        const risultato = await leggiSezione(sezione);
        res.json(risultato);
    } catch (err) {
        console.error('Errore lettura sezione listino:', err);
        res.status(500).json({ errore: err.message });
    }
});

// PUT /api/admin/listino/:sezione — Salva sezione (con backup automatico)
router.put('/:sezione', async (req, res) => {
    try {
        const { sezione } = req.params;
        if (!MAPPA_SEZIONI[sezione]) {
            return res.status(400).json({ errore: 'Sezione non valida' });
        }

        const { dati } = req.body;
        if (!dati) {
            return res.status(400).json({ errore: 'Dati mancanti' });
        }

        await scriviSezione(sezione, dati);

        // Invalida la cache del listino pubblico
        try {
            const { invalidaCache } = require('./listino');
            invalidaCache(sezione);
        } catch (e) { /* ignora se non disponibile */ }

        res.json({ messaggio: 'Sezione aggiornata', sezione });
    } catch (err) {
        console.error('Errore salvataggio sezione listino:', err);
        res.status(500).json({ errore: err.message });
    }
});

// GET /api/admin/listino/:sezione/backup — Lista backup
router.get('/:sezione/backup', async (req, res) => {
    try {
        const backup = await listaBackup(req.params.sezione);
        res.json(backup);
    } catch (err) {
        console.error('Errore lista backup:', err);
        res.status(500).json({ errore: err.message });
    }
});

// POST /api/admin/listino/:sezione/ripristina — Ripristina da backup
router.post('/:sezione/ripristina', async (req, res) => {
    try {
        const { backup_id } = req.body;
        if (!backup_id) {
            return res.status(400).json({ errore: 'ID backup mancante' });
        }

        const dati = await ripristinaDaBackup(req.params.sezione, backup_id);

        // Invalida cache
        try {
            const { invalidaCache } = require('./listino');
            invalidaCache(req.params.sezione);
        } catch (e) { /* ignora */ }

        res.json({ messaggio: 'Sezione ripristinata', dati });
    } catch (err) {
        console.error('Errore ripristino backup:', err);
        res.status(500).json({ errore: err.message });
    }
});

// POST /api/admin/listino/:sezione/importa — Importa da file JSON
router.post('/:sezione/importa', async (req, res) => {
    try {
        const { sezione } = req.params;
        if (!MAPPA_SEZIONI[sezione]) {
            return res.status(400).json({ errore: 'Sezione non valida' });
        }

        const dati = await importaDaFile(sezione);

        // Invalida cache
        try {
            const { invalidaCache } = require('./listino');
            invalidaCache(sezione);
        } catch (e) { /* ignora */ }

        res.json({ messaggio: 'Sezione importata da file', dati });
    } catch (err) {
        console.error('Errore importazione:', err);
        res.status(500).json({ errore: err.message });
    }
});

module.exports = router;
