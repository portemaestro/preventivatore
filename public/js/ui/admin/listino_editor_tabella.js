// Editor tabellare per sezioni listino semplici (optional, maniglioni, trasporto)
import { api } from '../../api.js';
import { creaModale, mostraNotifica } from './componenti_admin.js';

/**
 * Apre l'editor tabellare per una sezione del listino
 * @param {string} sezione - nome sezione
 * @param {string} nomeVisualizzato - nome leggibile
 * @param {Function} onSalvato - callback dopo salvataggio
 */
export async function apriEditorTabella(sezione, nomeVisualizzato, onSalvato) {
    const modale = creaModale({
        titolo: `Modifica: ${nomeVisualizzato}`,
        corpo: `<div class="text-center py-4">
            <div class="spinner-border text-primary"></div>
        </div>`,
        grandezza: 'xl',
        testoSalva: 'Salva modifiche',
        onSalva: async (m) => {
            await salva(sezione, m);
            if (onSalvato) onSalvato();
        }
    });

    try {
        const risultato = await api.get(`/admin/listino/${sezione}`);
        renderEditor(risultato.dati, sezione);
    } catch (err) {
        document.getElementById('modale-admin-corpo').innerHTML =
            `<div class="alert alert-danger">${err.message}</div>`;
    }
}

function renderEditor(dati, sezione) {
    const corpo = document.getElementById('modale-admin-corpo');

    // Analizza struttura dati per determinare il layout
    if (Array.isArray(dati)) {
        renderArrayTabella(corpo, dati, sezione);
    } else if (typeof dati === 'object') {
        renderOggettoTabella(corpo, dati, sezione);
    }
}

function renderArrayTabella(corpo, dati, sezione) {
    if (dati.length === 0) {
        corpo.innerHTML = '<p class="text-muted">Nessun elemento</p>';
        return;
    }

    // Prendi le chiavi dal primo elemento
    const chiavi = Object.keys(dati[0]);

    corpo.innerHTML = `
        <div class="editor-tabella">
            <div class="mb-2 d-flex justify-content-between align-items-center">
                <small class="text-muted">${dati.length} elementi</small>
                <button class="btn btn-outline-primary btn-sm" id="btn-aggiungi-riga">
                    <i class="bi bi-plus-lg me-1"></i>Aggiungi riga
                </button>
            </div>
            <div class="table-responsive" style="max-height:500px; overflow-y:auto">
                <table class="table table-sm table-bordered mb-0" id="tabella-editor">
                    <thead class="table-light sticky-top">
                        <tr>
                            ${chiavi.map(k => `<th class="small">${k}</th>`).join('')}
                            <th style="width:50px"></th>
                        </tr>
                    </thead>
                    <tbody>
                        ${dati.map((riga, i) => rigaHTML(riga, chiavi, i)).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;

    // Aggiungi riga
    document.getElementById('btn-aggiungi-riga').addEventListener('click', () => {
        const tbody = document.querySelector('#tabella-editor tbody');
        const nuovaRiga = {};
        chiavi.forEach(k => { nuovaRiga[k] = ''; });
        tbody.insertAdjacentHTML('beforeend', rigaHTML(nuovaRiga, chiavi, tbody.children.length));
        bindEliminaRiga();
    });

    bindEliminaRiga();
}

function rigaHTML(riga, chiavi, indice) {
    return `<tr data-indice="${indice}">
        ${chiavi.map(k => {
            const val = riga[k] ?? '';
            const tipo = typeof riga[k] === 'number' ? 'number' : 'text';
            const step = tipo === 'number' ? 'step="any"' : '';
            return `<td><input type="${tipo}" class="form-control form-control-sm campo-tabella"
                         data-chiave="${k}" value="${val}" ${step}></td>`;
        }).join('')}
        <td class="text-center">
            <button class="btn btn-sm btn-outline-danger btn-elimina-riga" title="Elimina">
                <i class="bi bi-x-lg"></i>
            </button>
        </td>
    </tr>`;
}

function renderOggettoTabella(corpo, dati, sezione) {
    // Per oggetti con sotto-sezioni (es. optional con categorie)
    let html = '<div class="editor-tabella">';

    for (const [chiave, valore] of Object.entries(dati)) {
        if (Array.isArray(valore)) {
            const chiavi = valore.length > 0 ? Object.keys(valore[0]) : [];
            html += `
                <h6 class="text-brand mt-3 mb-2">${chiave} (${valore.length} elementi)</h6>
                <div class="table-responsive mb-3" style="max-height:300px; overflow-y:auto">
                    <table class="table table-sm table-bordered mb-0 sotto-tabella" data-gruppo="${chiave}">
                        <thead class="table-light">
                            <tr>
                                ${chiavi.map(k => `<th class="small">${k}</th>`).join('')}
                            </tr>
                        </thead>
                        <tbody>
                            ${valore.map((riga, i) => `<tr>
                                ${chiavi.map(k => {
                                    const val = riga[k] ?? '';
                                    const tipo = typeof riga[k] === 'number' ? 'number' : 'text';
                                    const step = tipo === 'number' ? 'step="any"' : '';
                                    return `<td><input type="${tipo}" class="form-control form-control-sm campo-tabella"
                                                 data-gruppo="${chiave}" data-chiave="${k}" data-indice="${i}"
                                                 value="${val}" ${step}></td>`;
                                }).join('')}
                            </tr>`).join('')}
                        </tbody>
                    </table>
                </div>
            `;
        } else if (typeof valore === 'object' && valore !== null) {
            // Sotto-oggetto: mostra come coppie chiave-valore editabili
            html += `
                <h6 class="text-brand mt-3 mb-2">${chiave}</h6>
                <div class="row g-2 mb-3 sotto-oggetto" data-gruppo="${chiave}">
                    ${Object.entries(valore).map(([k, v]) => `
                        <div class="col-md-4">
                            <label class="form-label small text-muted">${k}</label>
                            <input type="${typeof v === 'number' ? 'number' : 'text'}"
                                   class="form-control form-control-sm campo-tabella"
                                   data-gruppo="${chiave}" data-chiave="${k}" value="${v ?? ''}"
                                   ${typeof v === 'number' ? 'step="any"' : ''}>
                        </div>
                    `).join('')}
                </div>
            `;
        } else {
            // Valore semplice
            html += `
                <div class="row g-2 mb-2">
                    <div class="col-md-4">
                        <label class="form-label small text-muted">${chiave}</label>
                        <input type="${typeof valore === 'number' ? 'number' : 'text'}"
                               class="form-control form-control-sm campo-tabella"
                               data-chiave="${chiave}" value="${valore ?? ''}"
                               ${typeof valore === 'number' ? 'step="any"' : ''}>
                    </div>
                </div>
            `;
        }
    }

    html += '</div>';
    corpo.innerHTML = html;
}

function bindEliminaRiga() {
    document.querySelectorAll('.btn-elimina-riga').forEach(btn => {
        btn.onclick = () => btn.closest('tr').remove();
    });
}

async function salva(sezione, modale) {
    // Ricostruisci i dati dalla tabella
    const corpo = document.getElementById('modale-admin-corpo');

    // Controlla se è una tabella singola (array) o un oggetto complesso
    const tabellaEditorSingola = corpo.querySelector('#tabella-editor');

    let dati;

    if (tabellaEditorSingola) {
        // Array semplice
        dati = [];
        tabellaEditorSingola.querySelectorAll('tbody tr').forEach(tr => {
            const riga = {};
            tr.querySelectorAll('.campo-tabella').forEach(input => {
                const val = input.value;
                riga[input.dataset.chiave] = input.type === 'number' && val !== '' ? parseFloat(val) : val;
            });
            dati.push(riga);
        });
    } else {
        // Oggetto complesso
        dati = {};

        // Sotto-tabelle (array)
        corpo.querySelectorAll('.sotto-tabella').forEach(tabella => {
            const gruppo = tabella.dataset.gruppo;
            dati[gruppo] = [];
            tabella.querySelectorAll('tbody tr').forEach(tr => {
                const riga = {};
                tr.querySelectorAll('.campo-tabella').forEach(input => {
                    const val = input.value;
                    riga[input.dataset.chiave] = input.type === 'number' && val !== '' ? parseFloat(val) : val;
                });
                dati[gruppo].push(riga);
            });
        });

        // Sotto-oggetti
        corpo.querySelectorAll('.sotto-oggetto').forEach(div => {
            const gruppo = div.dataset.gruppo;
            dati[gruppo] = {};
            div.querySelectorAll('.campo-tabella').forEach(input => {
                const val = input.value;
                dati[gruppo][input.dataset.chiave] = input.type === 'number' && val !== '' ? parseFloat(val) : val;
            });
        });

        // Valori semplici di root
        corpo.querySelectorAll('.campo-tabella:not([data-gruppo])').forEach(input => {
            if (!input.closest('#tabella-editor') && !input.closest('.sotto-tabella') && !input.closest('.sotto-oggetto')) {
                const val = input.value;
                dati[input.dataset.chiave] = input.type === 'number' && val !== '' ? parseFloat(val) : val;
            }
        });
    }

    await api.put(`/admin/listino/${sezione}`, { dati });
    modale.hide();
    mostraNotifica('Listino aggiornato', 'success');
}
