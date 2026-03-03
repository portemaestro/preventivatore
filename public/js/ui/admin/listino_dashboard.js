// Dashboard listino: griglia card per sezioni raggruppate
import { api } from '../../api.js';
import { mostraNotifica } from './componenti_admin.js';

let datiSezioni = null;

export async function renderListinoDashboard(container) {
    container.innerHTML = `
        <div class="d-flex justify-content-between align-items-center mb-3">
            <h5 class="mb-0"><i class="bi bi-tags me-2"></i>Gestione Listino Prezzi</h5>
        </div>
        <div id="listino-gruppi">
            <div class="text-center py-4">
                <div class="spinner-border spinner-border-sm text-primary"></div>
                <span class="ms-2 text-muted">Caricamento sezioni...</span>
            </div>
        </div>
    `;

    try {
        datiSezioni = await api.get('/admin/listino/sezioni');
        renderGruppi(container);
    } catch (err) {
        document.getElementById('listino-gruppi').innerHTML =
            `<div class="alert alert-danger">${err.message}</div>`;
    }
}

const ICONE_SEZIONI = {
    'blindati': 'bi-door-closed',
    'telai': 'bi-bounding-box',
    'supplementi_fuori_standard': 'bi-rulers',
    'cerniere_scomparsa': 'bi-gear',
    'rivestimenti_laminati': 'bi-layers',
    'rivestimenti_impiallacciati': 'bi-layers-half',
    'rivestimenti_stratificati': 'bi-stack',
    'rivestimenti_okoume': 'bi-tree',
    'rivestimenti_alluminio': 'bi-grid-3x3',
    'rivestimenti_pvc': 'bi-window',
    'optional': 'bi-puzzle',
    'serrature_motorizzate': 'bi-lock',
    'maniglioni': 'bi-grip-horizontal',
    'sfinestrature_sopraluce_fiancoluce': 'bi-border-outer',
    'trasporto_imballo': 'bi-truck'
};

const COLORI_GRUPPI = {
    'Blindati e Telai': '#1a3a5c',
    'Rivestimenti': '#6f42c1',
    'Accessori e Optional': '#198754',
    'Trasporto': '#e65100'
};

function renderGruppi(container) {
    const gruppiEl = document.getElementById('listino-gruppi');
    const { sezioni, gruppi } = datiSezioni;

    const mappaSezioni = {};
    sezioni.forEach(s => { mappaSezioni[s.sezione] = s; });

    let html = '';

    for (const [nomeGruppo, sezioniGruppo] of Object.entries(gruppi)) {
        const colore = COLORI_GRUPPI[nomeGruppo] || '#666';

        html += `
            <h6 class="mt-4 mb-3" style="color:${colore}">
                <i class="bi ${datiSezioni.icone_gruppi[nomeGruppo]?.icona || 'bi-folder'} me-1"></i>
                ${nomeGruppo}
            </h6>
            <div class="row g-3 mb-2">
        `;

        for (const sez of sezioniGruppo) {
            const info = mappaSezioni[sez] || {};
            const icona = ICONE_SEZIONI[sez] || 'bi-file-earmark';
            const aggiornato = info.aggiornato_il
                ? new Date(info.aggiornato_il).toLocaleDateString('it-IT', {
                    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
                })
                : 'Mai (da file)';

            html += `
                <div class="col-md-4 col-lg-3">
                    <div class="listino-card card" data-sezione="${sez}">
                        <div class="card-body d-flex align-items-start">
                            <div class="sezione-icona me-3" style="background:${colore}15; color:${colore}">
                                <i class="bi ${icona}"></i>
                            </div>
                            <div class="flex-grow-1">
                                <h6 class="mb-1 small fw-bold">${info.nome || sez}</h6>
                                <small class="text-muted d-block">
                                    ${info.in_db
                                        ? `<i class="bi bi-database-check text-success me-1"></i>In DB`
                                        : `<i class="bi bi-file-earmark text-warning me-1"></i>Solo file`}
                                </small>
                                <small class="text-muted d-block">${aggiornato}</small>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }

        html += '</div>';
    }

    gruppiEl.innerHTML = html;

    // Bind click sulle card
    gruppiEl.querySelectorAll('.listino-card').forEach(card => {
        card.addEventListener('click', async () => {
            const sezione = card.dataset.sezione;
            await apriEditor(sezione, container);
        });
    });
}

async function apriEditor(sezione, container) {
    const { apriEditorTabella } = await import('./listino_editor_tabella.js');
    apriEditorTabella(sezione, datiSezioni.nomi[sezione] || sezione, () => renderListinoDashboard(container));
}
