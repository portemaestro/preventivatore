// Utilità di formattazione prezzi e date

/**
 * Formatta un numero come prezzo in euro (formato italiano)
 * @param {number} valore
 * @returns {string} es. "1.280,00"
 */
export function formattaPrezzo(valore) {
    if (valore == null || isNaN(valore)) return '0,00';
    return Number(valore).toLocaleString('it-IT', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

/**
 * Formatta prezzo con simbolo euro
 * @param {number} valore
 * @returns {string} es. "€ 1.280,00"
 */
export function formattaEuro(valore) {
    return `€ ${formattaPrezzo(valore)}`;
}

/**
 * Parsa una stringa prezzo italiano in numero
 * @param {string} str es. "1.280,00" o "1280.00"
 * @returns {number}
 */
export function parsaPrezzo(str) {
    if (typeof str === 'number') return str;
    if (!str) return 0;
    // Rimuove punti separatore migliaia e sostituisce virgola con punto
    const pulito = String(str).replace(/\./g, '').replace(',', '.');
    const num = parseFloat(pulito);
    return isNaN(num) ? 0 : num;
}

/**
 * Arrotonda a 2 decimali
 */
export function arrotonda2(valore) {
    return Math.round(valore * 100) / 100;
}

/**
 * Formatta una data ISO in formato italiano
 * @param {string} dataISO
 * @returns {string} es. "02/03/2026"
 */
export function formattaData(dataISO) {
    if (!dataISO) return '';
    const d = new Date(dataISO);
    return d.toLocaleDateString('it-IT', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
}

/**
 * Formatta data per input date HTML (YYYY-MM-DD)
 */
export function formattaDataInput(dataISO) {
    if (!dataISO) {
        const oggi = new Date();
        return oggi.toISOString().split('T')[0];
    }
    return new Date(dataISO).toISOString().split('T')[0];
}
