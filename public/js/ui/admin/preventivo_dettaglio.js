// Dettaglio preventivo read-only con azioni
import { api } from '../../api.js';
import { creaModale, creaBadgeStato, mostraNotifica } from './componenti_admin.js';

function formattaData(val) {
    if (!val) return '';
    return new Date(val).toLocaleDateString('it-IT', {
        day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
}

function formattaPrezzo(val) {
    if (!val || parseFloat(val) === 0) return '€ 0,00';
    return parseFloat(val).toLocaleString('it-IT', { style: 'currency', currency: 'EUR' });
}

/**
 * Apre il dettaglio preventivo in un modale
 * @param {number|string} id - ID preventivo
 * @param {Function} onAggiornato - callback dopo cambio stato
 */
export async function apriDettaglioPreventivo(id, onAggiornato) {
    // Modale con spinner
    const modale = creaModale({
        titolo: 'Caricamento...',
        corpo: `<div class="text-center py-4">
            <div class="spinner-border text-primary"></div>
        </div>`,
        grandezza: 'xl',
        testoSalva: '',
        onSalva: null
    });

    // Nascondi bottone salva
    const btnSalva = document.querySelector('#modale-admin-salva');
    if (btnSalva) btnSalva.style.display = 'none';

    try {
        const prev = await api.get(`/preventivi/${id}`);

        // Aggiorna titolo
        document.querySelector('#modale-admin .modal-title').innerHTML =
            `Preventivo #${prev.numero} ${creaBadgeStato(prev.stato)}`;

        // Corpo
        const corpo = document.getElementById('modale-admin-corpo');
        corpo.innerHTML = `
            <!-- Intestazione -->
            <div class="row g-3 mb-4">
                <div class="col-md-6">
                    <div class="card border-0 bg-light">
                        <div class="card-body py-2">
                            <h6 class="text-brand mb-2"><i class="bi bi-building me-1"></i>Cliente</h6>
                            <strong>${prev.ragione_sociale || 'N/D'}</strong>
                            ${prev.rif ? `<br><small class="text-muted">Rif: ${prev.rif}</small>` : ''}
                            ${prev.citta ? `<br><small class="text-muted">${prev.citta}</small>` : ''}
                        </div>
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="card border-0 bg-light">
                        <div class="card-body py-2">
                            <h6 class="text-brand mb-2"><i class="bi bi-info-circle me-1"></i>Dettagli</h6>
                            <div class="row small">
                                <div class="col-6">
                                    <strong>Agenzia:</strong> ${prev.agenzia || 'N/D'}<br>
                                    <strong>Responsabile:</strong> ${prev.responsabile || 'N/D'}<br>
                                    <strong>Pagamento:</strong> ${prev.pagamento || 'N/D'}
                                </div>
                                <div class="col-6">
                                    <strong>Creato:</strong> ${formattaData(prev.data_creazione)}<br>
                                    <strong>Modificato:</strong> ${formattaData(prev.data_modifica)}<br>
                                    <strong>Evasione:</strong> ${prev.giorni_evasione || 45} gg
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Posizioni -->
            <h6 class="text-brand mb-2"><i class="bi bi-list-ol me-1"></i>Posizioni (${prev.posizioni?.length || 0})</h6>
            ${renderTabellaPositioni(prev.posizioni || [])}

            <!-- Riepilogo economico -->
            <div class="row mt-4">
                <div class="col-md-6 offset-md-6">
                    <div class="card border-brand">
                        <div class="card-header bg-brand text-white py-2">
                            <strong>Riepilogo Economico</strong>
                        </div>
                        <div class="card-body py-2">
                            ${renderRiepilogoEconomico(prev)}
                        </div>
                    </div>
                </div>
            </div>

            ${prev.note ? `
                <div class="mt-3">
                    <h6 class="text-brand"><i class="bi bi-chat-text me-1"></i>Note</h6>
                    <p class="small text-muted">${prev.note}</p>
                </div>
            ` : ''}

            <!-- Azioni -->
            <div class="mt-4 pt-3 border-top">
                <h6 class="text-brand mb-2"><i class="bi bi-lightning me-1"></i>Cambia stato</h6>
                <div id="dettaglio-azioni"></div>
            </div>
        `;

        renderAzioni(prev, modale, onAggiornato);

    } catch (err) {
        document.getElementById('modale-admin-corpo').innerHTML =
            `<div class="alert alert-danger">${err.message}</div>`;
    }
}

function renderTabellaPositioni(posizioni) {
    if (posizioni.length === 0) {
        return '<p class="text-muted small">Nessuna posizione</p>';
    }

    return `
        <div class="table-responsive">
            <table class="table table-sm table-admin">
                <thead>
                    <tr>
                        <th style="width:40px">N.</th>
                        <th>Tipo</th>
                        <th>Descrizione</th>
                        <th style="width:50px">Pz</th>
                        <th style="width:100px" class="text-end">Prezzo</th>
                        <th style="width:100px" class="text-end">Totale</th>
                    </tr>
                </thead>
                <tbody>
                    ${posizioni.map(p => `
                        <tr class="${!p.scontabile ? 'table-warning' : ''}">
                            <td>${p.numero_posizione}</td>
                            <td><span class="badge bg-secondary">${p.tipo}</span></td>
                            <td class="small">${abbreviaDescrizione(p.descrizione)}</td>
                            <td>${p.quantita}</td>
                            <td class="text-end">${formattaPrezzo(p.prezzo_unitario)}</td>
                            <td class="text-end fw-bold">${formattaPrezzo(p.totale)}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
}

function abbreviaDescrizione(desc) {
    if (!desc) return '';
    return desc.length > 80 ? desc.substring(0, 80) + '...' : desc;
}

function renderRiepilogoEconomico(prev) {
    const righe = [
        { etichetta: 'Totale Materiali', valore: prev.totale_materiali },
        { etichetta: `Sconto (${prev.sconto || 'N/D'})`, valore: null, speciale: true },
        { etichetta: 'Netto Materiali', valore: prev.netto_materiali },
        { etichetta: 'Tot. non scontabile', valore: prev.totale_non_scontabile },
        { etichetta: 'Imballo', valore: prev.imballo },
        { etichetta: 'Trasporto', valore: prev.trasporto },
        { etichetta: 'Imponibile', valore: prev.imponibile },
        { etichetta: 'IVA 22%', valore: prev.iva },
    ];

    let html = righe.map(r => {
        if (r.speciale) {
            return `<div class="d-flex justify-content-between small">
                <span class="text-muted">${r.etichetta}</span>
                <span>-</span>
            </div>`;
        }
        return `<div class="d-flex justify-content-between small">
            <span class="text-muted">${r.etichetta}</span>
            <span>${formattaPrezzo(r.valore)}</span>
        </div>`;
    }).join('');

    html += `
        <div class="d-flex justify-content-between mt-2 pt-2 border-top">
            <strong>TOTALE</strong>
            <strong class="text-brand fs-5">${formattaPrezzo(prev.totale)}</strong>
        </div>
    `;

    return html;
}

function renderAzioni(prev, modale, onAggiornato) {
    const azioniEl = document.getElementById('dettaglio-azioni');

    const transizioni = {
        'bozza': [{ stato: 'preventivo', testo: 'Conferma come Preventivo', classe: 'btn-info', icona: 'bi-check-circle' }],
        'preventivo': [
            { stato: 'bozza', testo: 'Riporta a Bozza', classe: 'btn-warning', icona: 'bi-arrow-counterclockwise' },
            { stato: 'ordine', testo: 'Conferma Ordine', classe: 'btn-success', icona: 'bi-bag-check' }
        ],
        'ordine': [
            { stato: 'preventivo', testo: 'Riporta a Preventivo', classe: 'btn-warning', icona: 'bi-arrow-counterclockwise' }
        ]
    };

    const azioniDisponibili = transizioni[prev.stato] || [];

    if (azioniDisponibili.length === 0) {
        azioniEl.innerHTML = '<p class="text-muted small">Nessuna azione disponibile</p>';
        return;
    }

    azioniEl.innerHTML = azioniDisponibili.map(a =>
        `<button class="btn ${a.classe} btn-sm me-2 btn-cambio-stato" data-stato="${a.stato}">
            <i class="bi ${a.icona} me-1"></i>${a.testo}
        </button>`
    ).join('');

    azioniEl.querySelectorAll('.btn-cambio-stato').forEach(btn => {
        btn.addEventListener('click', async () => {
            btn.disabled = true;
            btn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span>Aggiornamento...';
            try {
                await api.put(`/preventivi/${prev.id}/stato`, { stato: btn.dataset.stato });
                modale.hide();
                mostraNotifica(`Stato aggiornato a "${btn.dataset.stato}"`, 'success');
                if (onAggiornato) onAggiornato();
            } catch (err) {
                mostraNotifica(err.message, 'danger');
                btn.disabled = false;
                const azione = azioniDisponibili.find(a => a.stato === btn.dataset.stato);
                btn.innerHTML = `<i class="bi ${azione.icona} me-1"></i>${azione.testo}`;
            }
        });
    });
}
