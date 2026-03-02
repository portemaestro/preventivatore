/**
 * Formatta un prezzo in EUR con 2 decimali
 * @param {number} valore
 * @returns {string} es. "1.280,00"
 */
function formattaPrezzo(valore) {
    return valore.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

/**
 * Parsa una stringa prezzo italiano in numero
 * @param {string} str es. "1.280,00"
 * @returns {number}
 */
function parsaPrezzo(str) {
    if (typeof str === 'number') return str;
    return parseFloat(str.replace(/\./g, '').replace(',', '.'));
}

/**
 * Arrotonda a 2 decimali
 * @param {number} valore
 * @returns {number}
 */
function arrotonda2(valore) {
    return Math.round(valore * 100) / 100;
}

module.exports = { formattaPrezzo, parsaPrezzo, arrotonda2 };
