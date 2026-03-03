// Dashboard admin con card statistiche e ultimi preventivi
import { api } from '../../api.js';
import { creaBadgeStato } from './componenti_admin.js';

export async function renderAdminDashboard(container) {
    container.innerHTML = `
        <div id="admin-dashboard-contenuto">
            <div class="text-center py-4">
                <div class="spinner-border spinner-border-sm text-primary"></div>
                <span class="ms-2 text-muted">Caricamento dashboard...</span>
            </div>
        </div>
    `;

    try {
        const stats = await api.get('/admin/statistiche');
        renderContenuto(stats);
    } catch (err) {
        document.getElementById('admin-dashboard-contenuto').innerHTML =
            `<div class="alert alert-danger">${err.message}</div>`;
    }
}

function formattaPrezzo(val) {
    return parseFloat(val || 0).toLocaleString('it-IT', { style: 'currency', currency: 'EUR' });
}

function formattaData(val) {
    if (!val) return '';
    return new Date(val).toLocaleDateString('it-IT', {
        day: '2-digit', month: '2-digit', year: 'numeric'
    });
}

function renderContenuto(stats) {
    const el = document.getElementById('admin-dashboard-contenuto');

    el.innerHTML = `
        <!-- Card statistiche -->
        <div class="row g-3 mb-4">
            ${statCard('bi-people', '#1a3a5c', stats.totale_rivenditori, 'Rivenditori', 'bg-primary bg-opacity-10')}
            ${statCard('bi-file-earmark-text', '#0d6efd', stats.totale_preventivi, 'Preventivi totali', 'bg-info bg-opacity-10')}
            ${statCard('bi-bag-check', '#198754', stats.ordini, 'Ordini confermati', 'bg-success bg-opacity-10')}
            ${statCard('bi-calendar-month', '#c5a44e', stats.mese_corrente, 'Questo mese', 'bg-warning bg-opacity-10')}
        </div>

        <!-- Riga fatturato -->
        <div class="row g-3 mb-4">
            <div class="col-md-6">
                <div class="stat-card card">
                    <div class="card-body d-flex align-items-center">
                        <div class="stat-icona bg-success bg-opacity-10 text-success me-3">
                            <i class="bi bi-currency-euro"></i>
                        </div>
                        <div>
                            <div class="stat-valore">${formattaPrezzo(stats.fatturato_ordini)}</div>
                            <div class="stat-etichetta">Fatturato ordini totale</div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="col-md-6">
                <div class="stat-card card">
                    <div class="card-body d-flex align-items-center">
                        <div class="stat-icona bg-warning bg-opacity-10 text-warning me-3">
                            <i class="bi bi-graph-up"></i>
                        </div>
                        <div>
                            <div class="stat-valore">${formattaPrezzo(stats.fatturato_mese)}</div>
                            <div class="stat-etichetta">Fatturato mese corrente</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Riepilogo stati -->
        <div class="row g-3 mb-4">
            <div class="col-md-4">
                <div class="card border-0" style="background: linear-gradient(135deg, #fff3cd 0%, #ffeaa7 100%)">
                    <div class="card-body py-3 text-center">
                        <h3 class="mb-0">${stats.bozze}</h3>
                        <small class="text-muted">Bozze</small>
                    </div>
                </div>
            </div>
            <div class="col-md-4">
                <div class="card border-0" style="background: linear-gradient(135deg, #d1ecf1 0%, #bee5eb 100%)">
                    <div class="card-body py-3 text-center">
                        <h3 class="mb-0">${stats.preventivi_attivi}</h3>
                        <small class="text-muted">Preventivi attivi</small>
                    </div>
                </div>
            </div>
            <div class="col-md-4">
                <div class="card border-0" style="background: linear-gradient(135deg, #d4edda 0%, #c3e6cb 100%)">
                    <div class="card-body py-3 text-center">
                        <h3 class="mb-0">${stats.ordini}</h3>
                        <small class="text-muted">Ordini</small>
                    </div>
                </div>
            </div>
        </div>

        <!-- Ultimi preventivi -->
        <div class="card">
            <div class="card-header bg-brand text-white">
                <i class="bi bi-clock-history me-2"></i>Ultimi preventivi
            </div>
            <div class="card-body p-0">
                <div class="table-responsive">
                    <table class="table table-hover table-admin mb-0">
                        <thead>
                            <tr>
                                <th>N.</th>
                                <th>Stato</th>
                                <th>Cliente</th>
                                <th>Agenzia</th>
                                <th>Data</th>
                                <th class="text-end">Totale</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${stats.ultimi_preventivi.map(p => `
                                <tr class="cursor-pointer" onclick="window.location.hash='#admin-preventivi'">
                                    <td><strong>#${p.numero}</strong></td>
                                    <td>${creaBadgeStato(p.stato)}</td>
                                    <td>${p.ragione_sociale || 'N/D'}</td>
                                    <td>${p.agenzia || '-'}</td>
                                    <td>${formattaData(p.data_creazione)}</td>
                                    <td class="text-end">${formattaPrezzo(p.totale)}</td>
                                </tr>
                            `).join('')}
                            ${stats.ultimi_preventivi.length === 0
                                ? '<tr><td colspan="6" class="text-center text-muted py-3">Nessun preventivo</td></tr>'
                                : ''}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>

        <!-- Link rapidi -->
        <div class="row g-3 mt-3">
            <div class="col-md-4">
                <a href="#admin-rivenditori" class="card text-decoration-none border-0 shadow-sm">
                    <div class="card-body text-center py-3">
                        <i class="bi bi-people fs-3 text-brand"></i>
                        <div class="fw-bold mt-1">Gestione Rivenditori</div>
                    </div>
                </a>
            </div>
            <div class="col-md-4">
                <a href="#admin-preventivi" class="card text-decoration-none border-0 shadow-sm">
                    <div class="card-body text-center py-3">
                        <i class="bi bi-file-earmark-text fs-3 text-brand"></i>
                        <div class="fw-bold mt-1">Gestione Preventivi</div>
                    </div>
                </a>
            </div>
            <div class="col-md-4">
                <a href="#admin-listino" class="card text-decoration-none border-0 shadow-sm">
                    <div class="card-body text-center py-3">
                        <i class="bi bi-tags fs-3 text-brand"></i>
                        <div class="fw-bold mt-1">Listino Prezzi</div>
                    </div>
                </a>
            </div>
        </div>
    `;
}

function statCard(icona, colore, valore, etichetta, bgClass) {
    return `
        <div class="col-md-3 col-6">
            <div class="stat-card card">
                <div class="card-body d-flex align-items-center">
                    <div class="stat-icona ${bgClass} me-3" style="color:${colore}">
                        <i class="bi ${icona}"></i>
                    </div>
                    <div>
                        <div class="stat-valore" style="color:${colore}">${valore}</div>
                        <div class="stat-etichetta">${etichetta}</div>
                    </div>
                </div>
            </div>
        </div>
    `;
}
