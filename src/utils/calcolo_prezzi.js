const { arrotonda2 } = require('./helpers');

/**
 * Calcola lo sconto composto (es. "50+10" → prima -50%, poi -10% sul risultato)
 * @param {number} importo - Importo base
 * @param {string} sconto - Es. "50", "50+10", "50+5"
 * @returns {number} Importo scontato
 */
function calcolaSconto(importo, sconto) {
    if (!sconto || sconto === '0') return importo;

    const parti = sconto.split('+').map(s => parseFloat(s.trim()));
    let risultato = importo;

    for (const percentuale of parti) {
        risultato = risultato * (1 - percentuale / 100);
    }

    return arrotonda2(risultato);
}

/**
 * Calcola l'importo dello sconto (quanto si toglie)
 * @param {number} importo - Importo base
 * @param {string} sconto - Es. "50", "50+10"
 * @returns {number} Importo dello sconto
 */
function importoSconto(importo, sconto) {
    return arrotonda2(importo - calcolaSconto(importo, sconto));
}

/**
 * Ricalcola il riepilogo economico di un preventivo
 * @param {Array} posizioni - Array di posizioni con prezzo, quantita, scontabile
 * @param {string} sconto - Sconto da applicare sui materiali
 * @param {number} imballo - Costo imballo
 * @param {number} trasporto - Costo trasporto
 * @returns {object} Riepilogo con tutti i totali
 */
function calcolaRiepilogo(posizioni, sconto, imballo = 0, trasporto = 0) {
    let totale_materiali = 0;
    let totale_non_scontabile = 0;

    for (const pos of posizioni) {
        const totale_posizione = arrotonda2(pos.prezzo_unitario * pos.quantita);
        if (pos.scontabile) {
            totale_materiali += totale_posizione;
        } else {
            totale_non_scontabile += totale_posizione;
        }
    }

    totale_materiali = arrotonda2(totale_materiali);
    totale_non_scontabile = arrotonda2(totale_non_scontabile);

    const netto_materiali = calcolaSconto(totale_materiali, sconto);
    const imponibile = arrotonda2(netto_materiali + totale_non_scontabile + imballo + trasporto);
    const iva = arrotonda2(imponibile * 0.22);
    const totale = arrotonda2(imponibile + iva);

    return {
        totale_materiali,
        netto_materiali,
        totale_non_scontabile,
        imballo: arrotonda2(imballo),
        trasporto: arrotonda2(trasporto),
        imponibile,
        iva,
        totale
    };
}

module.exports = { calcolaSconto, importoSconto, calcolaRiepilogo };
