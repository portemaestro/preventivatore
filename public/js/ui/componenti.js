// Componenti UI riusabili
import { formattaEuro } from '../utils/formattazione.js';

/**
 * Crea un select Bootstrap con opzioni
 * @param {object} opts - { id, label, opzioni: [{value, text, prezzo?}], valore, onChange, classeCol }
 */
export function creaSelect({ id, label, opzioni, valore, onChange, classeCol = 'col-md-6', required = false }) {
    const div = document.createElement('div');
    div.className = classeCol + ' mb-3';
    div.innerHTML = `
        <label for="${id}" class="form-label">${label}${required ? ' *' : ''}</label>
        <select class="form-select" id="${id}" ${required ? 'required' : ''}>
            ${opzioni.map(o => {
                const prezzoStr = o.prezzo != null && o.prezzo !== 0 && o.prezzo !== 'standard'
                    ? ` (+${formattaEuro(o.prezzo)})` : (o.prezzo === 0 || o.prezzo === 'standard' ? ' (incluso)' : '');
                const selected = o.value === valore ? 'selected' : '';
                const disabled = o.disabled ? 'disabled' : '';
                return `<option value="${o.value}" ${selected} ${disabled}>${o.text}${prezzoStr}</option>`;
            }).join('')}
        </select>
    `;

    if (onChange) {
        div.querySelector('select').addEventListener('change', (e) => onChange(e.target.value));
    }

    return div;
}

/**
 * Crea un input numerico con label
 */
export function creaInputNumero({ id, label, valore, min, max, step = 1, onChange, classeCol = 'col-md-6', suffisso = '', required = false }) {
    const div = document.createElement('div');
    div.className = classeCol + ' mb-3';
    div.innerHTML = `
        <label for="${id}" class="form-label">${label}${required ? ' *' : ''}</label>
        <div class="input-group">
            <input type="number" class="form-control" id="${id}" value="${valore}"
                   min="${min || ''}" max="${max || ''}" step="${step}" ${required ? 'required' : ''}>
            ${suffisso ? `<span class="input-group-text">${suffisso}</span>` : ''}
        </div>
    `;

    if (onChange) {
        div.querySelector('input').addEventListener('change', (e) => onChange(parseFloat(e.target.value) || 0));
    }

    return div;
}

/**
 * Crea un input testo
 */
export function creaInputTesto({ id, label, valore, placeholder = '', onChange, classeCol = 'col-md-6', required = false }) {
    const div = document.createElement('div');
    div.className = classeCol + ' mb-3';
    div.innerHTML = `
        <label for="${id}" class="form-label">${label}${required ? ' *' : ''}</label>
        <input type="text" class="form-control" id="${id}" value="${valore || ''}"
               placeholder="${placeholder}" ${required ? 'required' : ''}>
    `;

    if (onChange) {
        div.querySelector('input').addEventListener('change', (e) => onChange(e.target.value));
    }

    return div;
}

/**
 * Crea un checkbox Bootstrap
 */
export function creaCheckbox({ id, label, checked, prezzo = null, onChange, classeCol = 'col-md-6' }) {
    const div = document.createElement('div');
    div.className = classeCol + ' mb-3';
    const prezzoStr = prezzo != null && prezzo !== 0
        ? `<span class="badge-prezzo supplemento ms-2">${formattaEuro(prezzo)}</span>` : '';

    div.innerHTML = `
        <div class="form-check">
            <input class="form-check-input" type="checkbox" id="${id}" ${checked ? 'checked' : ''}>
            <label class="form-check-label" for="${id}">${label}${prezzoStr}</label>
        </div>
    `;

    if (onChange) {
        div.querySelector('input').addEventListener('change', (e) => onChange(e.target.checked));
    }

    return div;
}

/**
 * Crea un badge prezzo
 */
export function badgePrezzo(prezzo, tipo = '') {
    if (prezzo == null || prezzo === 0) return '';
    const classe = prezzo < 0 ? 'sconto' : (tipo === 'incluso' ? 'incluso' : 'supplemento');
    return `<span class="badge-prezzo ${classe}">${prezzo < 0 ? '-' : '+'}${formattaEuro(Math.abs(prezzo))}</span>`;
}

/**
 * Crea un textarea
 */
export function creaTextarea({ id, label, valore, righe = 3, onChange, classeCol = 'col-12' }) {
    const div = document.createElement('div');
    div.className = classeCol + ' mb-3';
    div.innerHTML = `
        <label for="${id}" class="form-label">${label}</label>
        <textarea class="form-control" id="${id}" rows="${righe}">${valore || ''}</textarea>
    `;

    if (onChange) {
        div.querySelector('textarea').addEventListener('change', (e) => onChange(e.target.value));
    }

    return div;
}
