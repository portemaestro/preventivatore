const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const Utente = require('../models/utente');
const Rivenditore = require('../models/rivenditore');
const { verificaToken } = require('../middleware/auth');

const router = express.Router();

// POST /api/auth/login
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ errore: 'Username e password obbligatori' });
        }

        const utente = await Utente.trovaPerUsername(username.toLowerCase().trim());
        if (!utente) {
            return res.status(401).json({ errore: 'Credenziali non valide' });
        }

        if (!utente.attivo) {
            return res.status(401).json({ errore: 'Account disattivato' });
        }

        const passwordValida = await bcrypt.compare(password, utente.password_hash);
        if (!passwordValida) {
            return res.status(401).json({ errore: 'Credenziali non valide' });
        }

        // Se è rivenditore, recupera l'id rivenditore
        let rivenditore_id = null;
        if (utente.ruolo === 'rivenditore') {
            const rivenditore = await Rivenditore.trovaPerUtenteId(utente.id);
            rivenditore_id = rivenditore ? rivenditore.id : null;
        }

        const token = jwt.sign(
            {
                id: utente.id,
                username: utente.username,
                ruolo: utente.ruolo,
                rivenditore_id
            },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            token,
            utente: {
                id: utente.id,
                username: utente.username,
                ruolo: utente.ruolo,
                rivenditore_id
            }
        });
    } catch (err) {
        console.error('Errore login:', err);
        res.status(500).json({ errore: 'Errore interno del server' });
    }
});

// GET /api/auth/me
router.get('/me', verificaToken, async (req, res) => {
    try {
        const utente = await Utente.trovaPerId(req.utente.id);
        if (!utente) {
            return res.status(404).json({ errore: 'Utente non trovato' });
        }

        const risposta = {
            id: utente.id,
            username: utente.username,
            ruolo: utente.ruolo
        };

        if (utente.ruolo === 'rivenditore') {
            const rivenditore = await Rivenditore.trovaPerUtenteId(utente.id);
            risposta.rivenditore = rivenditore;
        }

        res.json(risposta);
    } catch (err) {
        console.error('Errore /me:', err);
        res.status(500).json({ errore: 'Errore interno del server' });
    }
});

module.exports = router;
