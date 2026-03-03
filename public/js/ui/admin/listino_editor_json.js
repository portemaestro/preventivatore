// Editor JSON raw per sezioni complesse del listino
import { api } from '../../api.js';
import { creaModale, mostraNotifica } from './componenti_admin.js';

/**
 * Apre l'editor JSON per una sezione del listino
 * @param {string} sezione - nome sezione
 * @param {string} nomeVisualizzato - nome leggibile
 * @param {Function} onSalvato - callback dopo salvataggio
 */
export async function apriEditorJSON(sezione, nomeVisualizzato, onSalvato) {
    const modale = creaModale({
        titolo: `Modifica: ${nomeVisualizzato}`,
        corpo: `<div class="text-center py-4">
            <div class="spinner-border text-primary"></div>
        </div>`,
        grandezza: 'xl',
        testoSalva: 'Salva modifiche',
        onSalva: async (m) => {
            await salvaJSON(sezione, m);
            if (onSalvato) onSalvato();
        }
    });

    try {
        const [risultato, backup] = await Promise.all([
            api.get(`/admin/listino/${sezione}`),
            api.get(`/admin/listino/${sezione}/backup`)
        ]);

        renderEditorJSON(risultato.dati, sezione, backup, nomeVisualizzato, onSalvato);
    } catch (err) {
        document.getElementById('modale-admin-corpo').innerHTML =
            `<div class="alert alert-danger">${err.message}</div>`;
    }
}

function renderEditorJSON(dati, sezione, backup, nomeVisualizzato, onSalvato) {
    const corpo = document.getElementById('modale-admin-corpo');
    const jsonFormattato = JSON.stringify(dati, null, 2);

    corpo.innerHTML = `
        <div class="editor-json">
            <!-- Toolbar -->
            <div class="d-flex justify-content-between align-items-center mb-2">
                <div>
                    <span id="validazione-stato" class="validazione-ok">
                        <i class="bi bi-check-circle me-1"></i>JSON valido
                    </span>
                </div>
                <div>
                    <button class="btn btn-outline-secondary btn-sm me-1" id="btn-formatta" title="Formatta JSON">
                        <i class="bi bi-code-square me-1"></i>Formatta
                    </button>
                    <button class="btn btn-outline-secondary btn-sm me-1" id="btn-comprimi" title="Comprimi JSON">
                        <i class="bi bi-arrows-collapse me-1"></i>Comprimi
                    </button>
                    <button class="btn btn-outline-warning btn-sm" id="btn-importa-file" title="Reimporta da file originale">
                        <i class="bi bi-arrow-repeat me-1"></i>Reimporta da file
                    </button>
                </div>
            </div>

            <!-- Preview struttura -->
            <div class="mb-2">
                <button class="btn btn-link btn-sm p-0 text-muted" type="button"
                        data-bs-toggle="collapse" data-bs-target="#preview-struttura">
                    <i class="bi bi-diagram-3 me-1"></i>Mostra struttura
                </button>
                <div class="collapse" id="preview-struttura">
                    <div class="bg-light border rounded p-2 mt-1 small" id="struttura-json">
                        ${renderStruttura(dati)}
                    </div>
                </div>
            </div>

            <!-- Textarea editor -->
            <textarea class="form-control" id="json-editor" spellcheck="false">${escapeHTML(jsonFormattato)}</textarea>

            <!-- Backup -->
            ${backup.length > 0 ? `
                <div class="mt-3">
                    <h6 class="small text-muted mb-2">
                        <i class="bi bi-clock-history me-1"></i>Backup disponibili (${backup.length})
                    </h6>
                    <div class="list-group list-group-flush">
                        ${backup.map(b => `
                            <div class="list-group-item d-flex justify-content-between align-items-center py-1 px-2">
                                <small class="text-muted">
                                    ${new Date(b.creato_il).toLocaleString('it-IT')}
                                </small>
                                <button class="btn btn-outline-secondary btn-sm py-0 btn-ripristina" data-id="${b.id}">
                                    <i class="bi bi-arrow-counterclockwise me-1"></i>Ripristina
                                </button>
                            </div>
                        `).join('')}
                    </div>
                </div>
            ` : ''}
        </div>
    `;

    const textarea = document.getElementById('json-editor');

    // Validazione real-time
    textarea.addEventListener('input', () => {
        const statoEl = document.getElementById('validazione-stato');
        try {
            JSON.parse(textarea.value);
            statoEl.className = 'validazione-ok';
            statoEl.innerHTML = '<i class="bi bi-check-circle me-1"></i>JSON valido';
        } catch (err) {
            statoEl.className = 'validazione-errore';
            statoEl.innerHTML = `<i class="bi bi-x-circle me-1"></i>${err.message}`;
        }
    });

    // Formatta
    document.getElementById('btn-formatta').addEventListener('click', () => {
        try {
            const parsed = JSON.parse(textarea.value);
            textarea.value = JSON.stringify(parsed, null, 2);
        } catch (err) {
            mostraNotifica('JSON non valido: impossibile formattare', 'warning');
        }
    });

    // Comprimi
    document.getElementById('btn-comprimi').addEventListener('click', () => {
        try {
            const parsed = JSON.parse(textarea.value);
            textarea.value = JSON.stringify(parsed);
        } catch (err) {
            mostraNotifica('JSON non valido: impossibile comprimere', 'warning');
        }
    });

    // Reimporta da file
    document.getElementById('btn-importa-file').addEventListener('click', async () => {
        if (!confirm('Reimportare i dati dal file originale? I dati attuali verranno sovrascritti.')) return;
        try {
            const risultato = await api.post(`/admin/listino/${sezione}/importa`);
            textarea.value = JSON.stringify(risultato.dati, null, 2);
            document.getElementById('struttura-json').innerHTML = renderStruttura(risultato.dati);
            mostraNotifica('Dati reimportati dal file', 'success');
        } catch (err) {
            mostraNotifica(err.message, 'danger');
        }
    });

    // Ripristina backup
    document.querySelectorAll('.btn-ripristina').forEach(btn => {
        btn.addEventListener('click', async () => {
            if (!confirm('Ripristinare questo backup? I dati attuali verranno sovrascritti.')) return;
            try {
                const risultato = await api.post(`/admin/listino/${sezione}/ripristina`, {
                    backup_id: parseInt(btn.dataset.id)
                });
                textarea.value = JSON.stringify(risultato.dati, null, 2);
                document.getElementById('struttura-json').innerHTML = renderStruttura(risultato.dati);
                mostraNotifica('Backup ripristinato', 'success');
            } catch (err) {
                mostraNotifica(err.message, 'danger');
            }
        });
    });

    // Tab support nella textarea
    textarea.addEventListener('keydown', (e) => {
        if (e.key === 'Tab') {
            e.preventDefault();
            const start = textarea.selectionStart;
            const end = textarea.selectionEnd;
            textarea.value = textarea.value.substring(0, start) + '  ' + textarea.value.substring(end);
            textarea.selectionStart = textarea.selectionEnd = start + 2;
        }
    });
}

function renderStruttura(dati, livello = 0) {
    if (dati === null || dati === undefined) return '<span class="text-muted">null</span>';

    if (Array.isArray(dati)) {
        const tipo = dati.length > 0 ? typeof dati[0] : 'vuoto';
        return `<span class="text-info">Array[${dati.length}]</span> di ${tipo === 'object' ? 'oggetti' : tipo}`;
    }

    if (typeof dati === 'object') {
        const chiavi = Object.keys(dati);
        if (livello > 1) return `<span class="text-warning">Oggetto{${chiavi.length} chiavi}</span>`;

        return `<ul class="list-unstyled mb-0 ms-3">
            ${chiavi.map(k => {
                const val = dati[k];
                return `<li><strong>${k}</strong>: ${renderStruttura(val, livello + 1)}</li>`;
            }).join('')}
        </ul>`;
    }

    return `<span class="text-success">${typeof dati}</span>`;
}

function escapeHTML(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

async function salvaJSON(sezione, modale) {
    const textarea = document.getElementById('json-editor');
    let dati;

    try {
        dati = JSON.parse(textarea.value);
    } catch (err) {
        throw new Error('JSON non valido: ' + err.message);
    }

    await api.put(`/admin/listino/${sezione}`, { dati });
    modale.hide();
    mostraNotifica('Listino aggiornato', 'success');
}
