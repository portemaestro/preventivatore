const express = require('express');
const { verificaToken } = require('../middleware/auth');
const { leggiSezione } = require('../utils/listino_db');

const router = express.Router();

// Tutte le route richiedono autenticazione
router.use(verificaToken);

// Cache in memoria con TTL di 5 minuti
const cache = {};
const CACHE_TTL = 5 * 60 * 1000;

async function caricaSezione(sezione) {
    const ora = Date.now();
    if (cache[sezione] && (ora - cache[sezione].ts) < CACHE_TTL) {
        return cache[sezione].dati;
    }

    const risultato = await leggiSezione(sezione);
    cache[sezione] = { dati: risultato.dati, ts: ora };
    return risultato.dati;
}

// Invalida cache (chiamato dall'admin quando salva)
function invalidaCache(sezione) {
    if (sezione) {
        delete cache[sezione];
    } else {
        Object.keys(cache).forEach(k => delete cache[k]);
    }
}

// GET /api/listino/blindati
router.get('/blindati', async (req, res) => {
    try {
        res.json(await caricaSezione('blindati'));
    } catch (err) {
        console.error('Errore caricamento blindati:', err);
        res.status(500).json({ errore: 'Errore caricamento dati listino' });
    }
});

// GET /api/listino/telai
router.get('/telai', async (req, res) => {
    try {
        res.json(await caricaSezione('telai'));
    } catch (err) {
        console.error('Errore caricamento telai:', err);
        res.status(500).json({ errore: 'Errore caricamento dati listino' });
    }
});

// GET /api/listino/rivestimenti/:tipo
router.get('/rivestimenti/:tipo', async (req, res) => {
    try {
        const mappaSezioni = {
            'laminati': 'rivestimenti_laminati',
            'impiallacciati': 'rivestimenti_impiallacciati',
            'stratificati': 'rivestimenti_stratificati',
            'okoume': 'rivestimenti_okoume',
            'alluminio': 'rivestimenti_alluminio',
            'pvc': 'rivestimenti_pvc'
        };

        const sezione = mappaSezioni[req.params.tipo];
        if (!sezione) {
            return res.status(400).json({
                errore: 'Tipo rivestimento non valido',
                tipi_validi: Object.keys(mappaSezioni)
            });
        }

        res.json(await caricaSezione(sezione));
    } catch (err) {
        console.error('Errore caricamento rivestimenti:', err);
        res.status(500).json({ errore: 'Errore caricamento dati listino' });
    }
});

// GET /api/listino/optional
router.get('/optional', async (req, res) => {
    try {
        const [optional, serrature, maniglioni, sfinestrature, cerniere] = await Promise.all([
            caricaSezione('optional'),
            caricaSezione('serrature_motorizzate'),
            caricaSezione('maniglioni'),
            caricaSezione('sfinestrature_sopraluce_fiancoluce'),
            caricaSezione('cerniere_scomparsa')
        ]);

        res.json({
            optional,
            serrature_motorizzate: serrature,
            maniglioni,
            sfinestrature_sopraluce_fiancoluce: sfinestrature,
            cerniere_scomparsa: cerniere
        });
    } catch (err) {
        console.error('Errore caricamento optional:', err);
        res.status(500).json({ errore: 'Errore caricamento dati listino' });
    }
});

// GET /api/listino/trasporto
router.get('/trasporto', async (req, res) => {
    try {
        res.json(await caricaSezione('trasporto_imballo'));
    } catch (err) {
        console.error('Errore caricamento trasporto:', err);
        res.status(500).json({ errore: 'Errore caricamento dati listino' });
    }
});

// GET /api/listino/supplementi
router.get('/supplementi', async (req, res) => {
    try {
        res.json(await caricaSezione('supplementi_fuori_standard'));
    } catch (err) {
        console.error('Errore caricamento supplementi:', err);
        res.status(500).json({ errore: 'Errore caricamento dati listino' });
    }
});

module.exports = router;
module.exports.invalidaCache = invalidaCache;
