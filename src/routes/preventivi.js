const express = require('express');
const Preventivo = require('../models/preventivo');
const { calcolaRiepilogo } = require('../utils/calcolo_prezzi');
const { verificaToken, soloAdmin } = require('../middleware/auth');

const router = express.Router();

// Tutte le route richiedono autenticazione
router.use(verificaToken);

// GET /api/preventivi — Lista preventivi (filtrata per ruolo)
router.get('/', async (req, res) => {
    try {
        const filtri = {};

        // Rivenditori vedono solo i propri preventivi
        if (req.utente.ruolo === 'rivenditore') {
            filtri.rivenditore_id = req.utente.rivenditore_id;
        }

        if (req.query.stato) filtri.stato = req.query.stato;
        if (req.query.agenzia) filtri.agenzia = req.query.agenzia;
        if (req.query.limite) filtri.limite = parseInt(req.query.limite);

        const preventivi = await Preventivo.lista(filtri);
        res.json(preventivi);
    } catch (err) {
        console.error('Errore lista preventivi:', err);
        res.status(500).json({ errore: 'Errore interno del server' });
    }
});

// GET /api/preventivi/:id — Dettaglio preventivo con posizioni
router.get('/:id', async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const preventivo = await Preventivo.trovaPerId(id);

        if (!preventivo) {
            return res.status(404).json({ errore: 'Preventivo non trovato' });
        }

        // Rivenditori vedono solo i propri preventivi
        if (req.utente.ruolo === 'rivenditore' &&
            preventivo.rivenditore_id !== req.utente.rivenditore_id) {
            return res.status(403).json({ errore: 'Accesso non autorizzato' });
        }

        const posizioni = await Preventivo.ottieniPosizioni(id);
        res.json({ ...preventivo, posizioni });
    } catch (err) {
        console.error('Errore dettaglio preventivo:', err);
        res.status(500).json({ errore: 'Errore interno del server' });
    }
});

// POST /api/preventivi — Crea nuovo preventivo
router.post('/', async (req, res) => {
    try {
        const { rivenditore_id } = req.body;

        if (!rivenditore_id) {
            return res.status(400).json({ errore: 'Rivenditore obbligatorio' });
        }

        // Rivenditori possono creare solo per sé stessi
        if (req.utente.ruolo === 'rivenditore' &&
            parseInt(rivenditore_id) !== req.utente.rivenditore_id) {
            return res.status(403).json({ errore: 'Puoi creare preventivi solo per il tuo account' });
        }

        const dati = {
            ...req.body,
            creato_da: req.utente.id
        };

        const preventivo = await Preventivo.crea(dati);
        res.status(201).json(preventivo);
    } catch (err) {
        console.error('Errore creazione preventivo:', err);
        res.status(500).json({ errore: 'Errore interno del server' });
    }
});

// PUT /api/preventivi/:id — Modifica preventivo
router.put('/:id', async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const preventivo = await Preventivo.trovaPerId(id);

        if (!preventivo) {
            return res.status(404).json({ errore: 'Preventivo non trovato' });
        }

        // Rivenditori vedono solo i propri
        if (req.utente.ruolo === 'rivenditore' &&
            preventivo.rivenditore_id !== req.utente.rivenditore_id) {
            return res.status(403).json({ errore: 'Accesso non autorizzato' });
        }

        // Ordini modificabili solo da admin
        if (preventivo.stato === 'ordine' && req.utente.ruolo !== 'admin') {
            return res.status(403).json({ errore: 'Gli ordini confermati sono modificabili solo dagli amministratori' });
        }

        const aggiornato = await Preventivo.aggiorna(id, req.body);

        // Ricalcola riepilogo se ci sono posizioni
        if (req.body.ricalcola) {
            const posizioni = await Preventivo.ottieniPosizioni(id);
            const riepilogo = calcolaRiepilogo(
                posizioni,
                aggiornato.sconto,
                parseFloat(aggiornato.imballo) || 0,
                parseFloat(aggiornato.trasporto) || 0
            );
            await Preventivo.aggiorna(id, riepilogo);
        }

        const risultato = await Preventivo.trovaPerId(id);
        res.json(risultato);
    } catch (err) {
        console.error('Errore aggiornamento preventivo:', err);
        res.status(500).json({ errore: 'Errore interno del server' });
    }
});

// PUT /api/preventivi/:id/stato — Cambia stato
router.put('/:id/stato', async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const { stato } = req.body;

        const transizioni = {
            'bozza': ['preventivo'],
            'preventivo': ['bozza', 'ordine'],
            'ordine': ['preventivo']  // solo admin
        };

        const preventivo = await Preventivo.trovaPerId(id);
        if (!preventivo) {
            return res.status(404).json({ errore: 'Preventivo non trovato' });
        }

        // Rivenditori vedono solo i propri
        if (req.utente.ruolo === 'rivenditore' &&
            preventivo.rivenditore_id !== req.utente.rivenditore_id) {
            return res.status(403).json({ errore: 'Accesso non autorizzato' });
        }

        // Verifica transizione valida
        const transizioniValide = transizioni[preventivo.stato] || [];
        if (!transizioniValide.includes(stato)) {
            return res.status(400).json({
                errore: `Transizione non valida da "${preventivo.stato}" a "${stato}"`
            });
        }

        // Solo admin può tornare da ordine a preventivo
        if (preventivo.stato === 'ordine' && req.utente.ruolo !== 'admin') {
            return res.status(403).json({ errore: 'Solo gli amministratori possono modificare lo stato degli ordini' });
        }

        const aggiornato = await Preventivo.cambiaStato(id, stato);
        res.json(aggiornato);
    } catch (err) {
        console.error('Errore cambio stato:', err);
        res.status(500).json({ errore: 'Errore interno del server' });
    }
});

// --- Posizioni ---

// POST /api/preventivi/:id/posizioni — Aggiungi posizione
router.post('/:id/posizioni', async (req, res) => {
    try {
        const preventivoId = parseInt(req.params.id);
        const preventivo = await Preventivo.trovaPerId(preventivoId);

        if (!preventivo) {
            return res.status(404).json({ errore: 'Preventivo non trovato' });
        }

        if (preventivo.stato === 'ordine' && req.utente.ruolo !== 'admin') {
            return res.status(403).json({ errore: 'Ordine non modificabile' });
        }

        const posizione = await Preventivo.aggiungiPosizione(preventivoId, req.body);
        res.status(201).json(posizione);
    } catch (err) {
        console.error('Errore aggiunta posizione:', err);
        res.status(500).json({ errore: 'Errore interno del server' });
    }
});

// PUT /api/preventivi/:prevId/posizioni/:posId — Modifica posizione
router.put('/:prevId/posizioni/:posId', async (req, res) => {
    try {
        const posId = parseInt(req.params.posId);
        const aggiornata = await Preventivo.aggiornaPosizione(posId, req.body);

        if (!aggiornata) {
            return res.status(404).json({ errore: 'Posizione non trovata' });
        }

        res.json(aggiornata);
    } catch (err) {
        console.error('Errore aggiornamento posizione:', err);
        res.status(500).json({ errore: 'Errore interno del server' });
    }
});

// DELETE /api/preventivi/:prevId/posizioni/:posId — Elimina posizione
router.delete('/:prevId/posizioni/:posId', async (req, res) => {
    try {
        const posId = parseInt(req.params.posId);
        await Preventivo.eliminaPosizione(posId);
        res.json({ messaggio: 'Posizione eliminata' });
    } catch (err) {
        console.error('Errore eliminazione posizione:', err);
        res.status(500).json({ errore: 'Errore interno del server' });
    }
});

module.exports = router;
