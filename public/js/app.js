// Entry point applicazione
import { isAutenticato } from './auth.js';
import { initRouter, registraRoute } from './router.js';
import { renderNavbar } from './ui/navbar.js';
import { renderConfiguratore } from './ui/configuratore.js';
import { caricaListino } from './listino.js';

// Registra le route
registraRoute('configuratore', async (container) => {
    // Mostra navbar
    renderNavbar();

    // Mostra spinner caricamento
    container.innerHTML = `
        <div class="caricamento-listino">
            <div class="spinner-border text-primary" role="status"></div>
            <p class="mt-3 text-muted">Caricamento listino prezzi...</p>
        </div>
    `;

    try {
        // Carica listino (se non già cachato)
        await caricaListino();
        // Renderizza il configuratore
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

// Avvia il router
initRouter();
