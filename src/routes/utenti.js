const express = require('express');
const bcrypt = require('bcrypt');
const Utente = require('../models/utente');
const Rivenditore = require('../models/rivenditore');
const { verificaToken, soloAdmin } = require('../middleware/auth');

const router = express.Router();
router.use(verificaToken);
router.use(soloAdmin);

// POST /api/utenti — Crea utente rivenditore (solo admin)
router.post('/', async (req, res) => {
    try {
        const { username, password, rivenditore_id } = req.body;

        if (!username || !password) {
            return res.status(400).json({ errore: 'Username e password obbligatori' });
        }

        if (password.length < 6) {
            return res.status(400).json({ errore: 'La password deve avere almeno 6 caratteri' });
        }

        // Verifica username unico
        const esistente = await Utente.trovaPerUsername(username);
        if (esistente) {
            return res.status(409).json({ errore: 'Username già in uso' });
        }

        const passwordHash = await bcrypt.hash(password, 10);
        const utente = await Utente.crea(username, passwordHash, 'rivenditore');

        // Collega al rivenditore se specificato
        if (rivenditore_id) {
            await Rivenditore.aggiorna(parseInt(rivenditore_id), { utente_id: utente.id });
        }

        res.status(201).json(utente);
    } catch (err) {
        console.error('Errore creazione utente:', err);
        res.status(500).json({ errore: 'Errore interno del server' });
    }
});

// PUT /api/utenti/:id/password — Cambia password (solo admin)
router.put('/:id/password', async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const { password } = req.body;

        if (!password || password.length < 6) {
            return res.status(400).json({ errore: 'La password deve avere almeno 6 caratteri' });
        }

        const passwordHash = await bcrypt.hash(password, 10);
        const aggiornato = await Utente.aggiorna(id, { password_hash: passwordHash });

        if (!aggiornato) {
            return res.status(404).json({ errore: 'Utente non trovato' });
        }

        res.json({ messaggio: 'Password aggiornata' });
    } catch (err) {
        console.error('Errore aggiornamento password:', err);
        res.status(500).json({ errore: 'Errore interno del server' });
    }
});

// PUT /api/utenti/:id/stato — Attiva/disattiva utente (solo admin)
router.put('/:id/stato', async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const { attivo } = req.body;

        const aggiornato = await Utente.aggiorna(id, { attivo });

        if (!aggiornato) {
            return res.status(404).json({ errore: 'Utente non trovato' });
        }

        res.json(aggiornato);
    } catch (err) {
        console.error('Errore cambio stato utente:', err);
        res.status(500).json({ errore: 'Errore interno del server' });
    }
});

module.exports = router;
