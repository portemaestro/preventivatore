// Hash router semplice per SPA
import { isAutenticato } from './auth.js';
import { renderLogin } from './ui/login.js';

// Registry delle route
const routes = {};

/**
 * Registra una route
 * @param {string} hash - es. 'configuratore'
 * @param {Function} renderFn - funzione(container)
 */
export function registraRoute(hash, renderFn) {
    routes[hash] = renderFn;
}

/**
 * Naviga a una route
 */
export function naviga(hash) {
    window.location.hash = `#${hash}`;
}

/**
 * Inizializza il router
 */
export function initRouter() {
    window.addEventListener('hashchange', gestisciRoute);
    gestisciRoute();
}

function gestisciRoute() {
    const hash = window.location.hash.replace('#', '') || '';
    const container = document.getElementById('app');

    // Se non autenticato, mostra login
    if (!isAutenticato()) {
        if (hash !== 'login') {
            window.location.hash = '#login';
            return;
        }
        renderLogin(container);
        // Nascondi navbar nel login
        document.getElementById('navbar-container').innerHTML = '';
        return;
    }

    // Se autenticato e su login, vai al configuratore
    if (hash === 'login' || hash === '') {
        window.location.hash = '#configuratore';
        return;
    }

    // Cerca la route registrata
    if (routes[hash]) {
        routes[hash](container);
    } else {
        container.innerHTML = `
            <div class="text-center py-5">
                <h4 class="text-muted">Pagina non trovata</h4>
                <a href="#configuratore" class="btn btn-primary mt-3">Torna al configuratore</a>
            </div>
        `;
    }
}
