// Layout area admin con nav-tabs
import { renderNavbar } from '../navbar.js';

const TABS = [
    { hash: 'admin', icona: 'bi-speedometer2', testo: 'Dashboard' },
    { hash: 'admin-rivenditori', icona: 'bi-people', testo: 'Rivenditori' },
    { hash: 'admin-preventivi', icona: 'bi-file-earmark-text', testo: 'Preventivi' },
    { hash: 'admin-listino', icona: 'bi-tags', testo: 'Listino Prezzi' }
];

/**
 * Renderizza il layout admin con tabs di navigazione
 * @param {HTMLElement} container - #app
 * @param {string} tabAttiva - hash della tab attiva
 * @param {Function} renderContenuto - funzione che popola il contenuto
 */
export function renderAdminLayout(container, tabAttiva, renderContenuto) {
    renderNavbar();

    container.innerHTML = `
        <div class="container-fluid py-3 area-admin">
            <div class="d-flex align-items-center mb-3">
                <h4 class="mb-0 text-brand">
                    <i class="bi bi-gear me-2"></i>Area Amministrazione
                </h4>
            </div>
            <ul class="nav nav-tabs nav-admin mb-3" id="admin-tabs">
                ${TABS.map(t => `
                    <li class="nav-item">
                        <a class="nav-link ${t.hash === tabAttiva ? 'active' : ''}" href="#${t.hash}">
                            <i class="bi ${t.icona} me-1"></i>${t.testo}
                        </a>
                    </li>
                `).join('')}
            </ul>
            <div id="admin-contenuto"></div>
        </div>
    `;

    const contenutoEl = document.getElementById('admin-contenuto');
    if (renderContenuto) renderContenuto(contenutoEl);
}
