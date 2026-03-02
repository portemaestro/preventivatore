// Wrapper fetch() con gestione Bearer token e errori
import { API_BASE, STORAGE_KEYS } from './config.js';

/**
 * Esegue una richiesta API con token JWT automatico
 * @param {string} endpoint - es. '/auth/login'
 * @param {object} opzioni - { method, body, ... }
 * @returns {Promise<any>} risposta JSON
 */
export async function apiFetch(endpoint, opzioni = {}) {
    const url = `${API_BASE}${endpoint}`;
    const token = localStorage.getItem(STORAGE_KEYS.TOKEN);

    const headers = {
        'Content-Type': 'application/json',
        ...opzioni.headers
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const config = {
        method: opzioni.method || 'GET',
        headers,
        ...opzioni
    };

    if (opzioni.body && typeof opzioni.body === 'object') {
        config.body = JSON.stringify(opzioni.body);
    }
    // Rimuovi headers dalla config originale per evitare duplicazione
    delete config.headers;
    config.headers = headers;

    const risposta = await fetch(url, config);

    // Token scaduto o non valido → redirect al login
    if (risposta.status === 401) {
        localStorage.removeItem(STORAGE_KEYS.TOKEN);
        localStorage.removeItem(STORAGE_KEYS.UTENTE);
        window.location.hash = '#login';
        throw new Error('Sessione scaduta. Effettua nuovamente il login.');
    }

    if (!risposta.ok) {
        const errore = await risposta.json().catch(() => ({ errore: risposta.statusText }));
        throw new Error(errore.errore || errore.message || `Errore ${risposta.status}`);
    }

    return risposta.json();
}

// Scorciatoie per i metodi HTTP
export const api = {
    get: (endpoint) => apiFetch(endpoint),
    post: (endpoint, body) => apiFetch(endpoint, { method: 'POST', body }),
    put: (endpoint, body) => apiFetch(endpoint, { method: 'PUT', body }),
    delete: (endpoint) => apiFetch(endpoint, { method: 'DELETE' })
};
