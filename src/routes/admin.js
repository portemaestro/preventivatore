const express = require('express');
const Preventivo = require('../models/preventivo');
const Rivenditore = require('../models/rivenditore');
const { verificaToken, soloAdmin } = require('../middleware/auth');

const router = express.Router();
router.use(verificaToken);
router.use(soloAdmin);

// GET /api/admin/statistiche — Statistiche dashboard
router.get('/statistiche', async (req, res) => {
    try {
        const [stats, totaleRivenditori, ultimiPreventivi] = await Promise.all([
            Preventivo.statistiche(),
            Rivenditore.contaTotale(),
            Preventivo.lista({ limite: 10 })
        ]);

        res.json({
            totale_rivenditori: totaleRivenditori,
            totale_preventivi: parseInt(stats.totale_preventivi),
            bozze: parseInt(stats.bozze),
            preventivi_attivi: parseInt(stats.preventivi_attivi),
            ordini: parseInt(stats.ordini),
            mese_corrente: parseInt(stats.mese_corrente),
            fatturato_ordini: parseFloat(stats.fatturato_ordini),
            fatturato_mese: parseFloat(stats.fatturato_mese),
            ultimi_preventivi: ultimiPreventivi
        });
    } catch (err) {
        console.error('Errore statistiche admin:', err);
        res.status(500).json({ errore: 'Errore interno del server' });
    }
});

module.exports = router;
