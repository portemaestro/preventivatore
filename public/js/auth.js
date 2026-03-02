// Gestione autenticazione: login, logout, stato sessione
import { STORAGE_KEYS } from './config.js';
import { api } from './api.js';

/**
 * Effettua il login
 * @param {string} username
 * @param {string} password
 * @returns {Promise<object>} dati utente
 */
export async function login(username, password) {
    const risposta = await api.post('/auth/login', { username, password });
    localStorage.setItem(STORAGE_KEYS.TOKEN, risposta.token);
    localStorage.setItem(STORAGE_KEYS.UTENTE, JSON.stringify(risposta.utente));
    return risposta.utente;
}

/**
 * Effettua il logout
 */
export function logout() {
    localStorage.removeItem(STORAGE_KEYS.TOKEN);
    localStorage.removeItem(STORAGE_KEYS.UTENTE);
    window.location.hash = '#login';
}

/**
 * Verifica se l'utente è autenticato
 */
export function isAutenticato() {
    return !!localStorage.getItem(STORAGE_KEYS.TOKEN);
}

/**
 * Ottiene i dati utente salvati localmente
 */
export function getUtente() {
    const dati = localStorage.getItem(STORAGE_KEYS.UTENTE);
    return dati ? JSON.parse(dati) : null;
}

/**
 * Verifica se l'utente è admin
 */
export function isAdmin() {
    const utente = getUtente();
    return utente && utente.ruolo === 'admin';
}
