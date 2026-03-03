// Entry point applicazione
import { isAutenticato, isAdmin } from './auth.js';
import { initRouter, registraRoute } from './router.js';
import { renderNavbar } from './ui/navbar.js';
import { renderConfiguratore } from './ui/configuratore.js';
import { caricaListino } from './listino.js';
import { renderAdminLayout } from './ui/admin/admin_layout.js';

// Route: Configuratore preventivo
registraRoute('configuratore', async (container) => {
    renderNavbar();

    container.innerHTML = `
        <div class="caricamento-listino">
            <div class="spinner-border text-primary" role="status"></div>
            <p class="mt-3 text-muted">Caricamento listino prezzi...</p>
        </div>
    `;

    try {
        await caricaListino();
        renderConfiguratore(container);
    } catch (err) {
        container.innerHTML = `
            <div class="alert alert-danger m-4">
                <h5><i class="bi bi-exclamation-triangle me-2"></i>Errore caricamento</h5>
                <p>${err.message}</p>
                <button class="btn btn-primary btn-sm" onclick="location.reload()">Riprova</button>
            </div>
        `;
    }
});

// Route Admin: Dashboard
registraRoute('admin', async (container) => {
    if (!isAdmin()) { window.location.hash = '#configuratore'; return; }
    const { renderAdminDashboard } = await import('./ui/admin/admin_dashboard.js');
    renderAdminLayout(container, 'admin', renderAdminDashboard);
});

// Route Admin: Rivenditori
registraRoute('admin-rivenditori', async (container) => {
    if (!isAdmin()) { window.location.hash = '#configuratore'; return; }
    const { renderRivenditoriLista } = await import('./ui/admin/rivenditori_lista.js');
    renderAdminLayout(container, 'admin-rivenditori', renderRivenditoriLista);
});

// Route Admin: Preventivi
registraRoute('admin-preventivi', async (container) => {
    if (!isAdmin()) { window.location.hash = '#configuratore'; return; }
    const { renderPreventiviLista } = await import('./ui/admin/preventivi_lista.js');
    renderAdminLayout(container, 'admin-preventivi', renderPreventiviLista);
});

// Route Admin: Listino
registraRoute('admin-listino', async (container) => {
    if (!isAdmin()) { window.location.hash = '#configuratore'; return; }
    const { renderListinoDashboard } = await import('./ui/admin/listino_dashboard.js');
    renderAdminLayout(container, 'admin-listino', renderListinoDashboard);
});

// Avvia il router
initRouter();
