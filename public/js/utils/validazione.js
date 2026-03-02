// Validazione misure e campi obbligatori

/**
 * Valida le misure del blindato
 * @returns {{ valido: boolean, errori: string[] }}
 */
export function validaMisure(larghezza, altezza) {
    const errori = [];

    if (!larghezza || larghezza < 600) errori.push('Larghezza minima: 600mm');
    if (larghezza > 1200) errori.push('Larghezza massima: 1200mm');
    if (!altezza || altezza < 1800) errori.push('Altezza minima: 1800mm');
    if (altezza > 2900) errori.push('Altezza massima: 2900mm');

    return { valido: errori.length === 0, errori };
}

/**
 * Verifica se la misura è standard
 */
export function isMisuraStandard(larghezza, altezza) {
    return larghezza <= 900 && altezza >= 1905 && altezza <= 2100;
}

/**
 * Valida il preventivo completo prima del salvataggio
 */
export function validaPreventivo(preventivo) {
    const errori = [];

    // Blindato
    const mis = validaMisure(preventivo.blindato.larghezza, preventivo.blindato.altezza);
    if (!mis.valido) errori.push(...mis.errori);

    return { valido: errori.length === 0, errori };
}
