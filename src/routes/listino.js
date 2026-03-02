const express = require('express');
const fs = require('fs');
const path = require('path');
const { verificaToken } = require('../middleware/auth');

const router = express.Router();

// Tutte le route richiedono autenticazione
router.use(verificaToken);

// Cache in memoria per i file JSON del listino
const cache = {};

function caricaJSON(nomeFile) {
    if (cache[nomeFile]) return cache[nomeFile];

    const percorso = path.join(__dirname, '..', '..', 'data', nomeFile);
    const contenuto = fs.readFileSync(percorso, 'utf-8');
    cache[nomeFile] = JSON.parse(contenuto);
    return cache[nomeFile];
}

// GET /api/listino/blindati
router.get('/blindati', (req, res) => {
    try {
        const dati = caricaJSON('blindati.json');
        res.json(dati);
    } catch (err) {
        console.error('Errore caricamento blindati:', err);
        res.status(500).json({ errore: 'Errore caricamento dati listino' });
    }
});

// GET /api/listino/telai
router.get('/telai', (req, res) => {
    try {
        const dati = caricaJSON('telai.json');
        res.json(dati);
    } catch (err) {
        console.error('Errore caricamento telai:', err);
        res.status(500).json({ errore: 'Errore caricamento dati listino' });
    }
});

// GET /api/listino/rivestimenti/:tipo
// tipo: laminati, impiallacciati, stratificati, okoume, alluminio, pvc
router.get('/rivestimenti/:tipo', (req, res) => {
    try {
        const mappaFile = {
            'laminati': 'rivestimenti_laminati.json',
            'impiallacciati': 'rivestimenti_impiallacciati.json',
            'stratificati': 'rivestimenti_stratificati.json',
            'okoume': 'rivestimenti_okoume.json',
            'alluminio': 'rivestimenti_alluminio.json',
            'pvc': 'rivestimenti_pvc.json'
        };

        const nomeFile = mappaFile[req.params.tipo];
        if (!nomeFile) {
            return res.status(400).json({
                errore: 'Tipo rivestimento non valido',
                tipi_validi: Object.keys(mappaFile)
            });
        }

        const dati = caricaJSON(nomeFile);
        res.json(dati);
    } catch (err) {
        console.error('Errore caricamento rivestimenti:', err);
        res.status(500).json({ errore: 'Errore caricamento dati listino' });
    }
});

// GET /api/listino/optional
router.get('/optional', (req, res) => {
    try {
        const optional = caricaJSON('optional.json');
        const serrature = caricaJSON('serrature_motorizzate.json');
        const maniglioni = caricaJSON('maniglioni.json');
        const sfinestrature = caricaJSON('sfinestrature_sopraluce_fiancoluce.json');
        const cerniere = caricaJSON('cerniere_scomparsa.json');

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
router.get('/trasporto', (req, res) => {
    try {
        const dati = caricaJSON('trasporto_imballo.json');
        res.json(dati);
    } catch (err) {
        console.error('Errore caricamento trasporto:', err);
        res.status(500).json({ errore: 'Errore caricamento dati listino' });
    }
});

// GET /api/listino/supplementi
router.get('/supplementi', (req, res) => {
    try {
        const dati = caricaJSON('supplementi_fuori_standard.json');
        res.json(dati);
    } catch (err) {
        console.error('Errore caricamento supplementi:', err);
        res.status(500).json({ errore: 'Errore caricamento dati listino' });
    }
});

module.exports = router;
