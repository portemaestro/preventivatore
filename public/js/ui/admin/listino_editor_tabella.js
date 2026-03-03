// Editor tabellare universale per tutte le sezioni del listino
// Renderer ricorsivo che gestisce qualsiasi livello di nesting
import { api } from '../../api.js';
import { creaModale, mostraNotifica } from './componenti_admin.js';

let contatorAccordion = 0;

/**
 * Converte chiave snake_case in etichetta leggibile
 * es. "prezzo_base" → "Prezzo base", "1_anta" → "1 Anta", "kit_coibentazione_termica" → "Kit coibentazione termica"
 */
function etichettaDaChiave(chiave) {
    return chiave
        .replace(/_/g, ' ')
        .replace(/\b\w/g, (c, i, str) => {
            // Capitalizza la prima lettera della stringa e dopo i numeri
            if (i === 0) return c.toUpperCase();
            // Non capitalizzare preposizioni/articoli brevi nel mezzo
            const parola = str.slice(i).split(' ')[0];
            if (['a', 'e', 'di', 'da', 'in', 'per', 'con', 'su', 'il', 'la', 'lo', 'le', 'i', 'gli', 'un', 'una'].includes(parola.toLowerCase())) {
                return c;
            }
            return c.toUpperCase();
        });
}

/**
 * Escapa HTML
 */
function escapeHTML(str) {
    if (typeof str !== 'string') return String(str ?? '');
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/**
 * Determina se un valore è un oggetto con solo valori semplici (numeri/stringhe)
 */
function isOggettoSemplice(obj) {
    if (typeof obj !== 'object' || obj === null || Array.isArray(obj)) return false;
    return Object.values(obj).every(v => typeof v === 'number' || typeof v === 'string' || v === null);
}

/**
 * Determina se un array contiene solo oggetti con valori semplici (tabella)
 */
function isArrayTabellare(arr) {
    if (!Array.isArray(arr) || arr.length === 0) return false;
    return arr.every(item => typeof item === 'object' && item !== null && !Array.isArray(item) &&
        Object.values(item).every(v => typeof v === 'number' || typeof v === 'string' || typeof v === 'boolean' || v === null));
}

/**
 * Determina se una chiave rappresenta una nota
 */
function isNota(chiave, valore) {
    return typeof valore === 'string' && (chiave === 'nota' || chiave.startsWith('nota_') || chiave === 'note' || chiave === 'disponibilita_venatura');
}

/**
 * Genera un ID univoco per gli accordion
 */
function idAccordion() {
    return `acc-${++contatorAccordion}`;
}

/**
 * Renderizza un nodo del JSON in HTML editabile
 * @param {string} chiave - nome della chiave
 * @param {*} valore - valore da renderizzare
 * @param {string} percorso - percorso completo nel JSON (es. "modelli.0.prezzo")
 * @param {number} livello - profondità di nesting (per stile accordion)
 * @returns {string} HTML
 */
function renderNodo(chiave, valore, percorso, livello = 0) {
    // Nota/stringa informativa → badge non editabile
    if (isNota(chiave, valore)) {
        return `<div class="nota-listino mb-2" data-percorso="${percorso}">
            <i class="bi bi-info-circle me-1"></i>
            <span class="text-muted small">${escapeHTML(valore)}</span>
        </div>`;
    }

    // Valore null
    if (valore === null || valore === undefined) {
        return renderCampoSingolo(chiave, '', percorso, 'text', true);
    }

    // Valore booleano → checkbox o campo testo
    if (typeof valore === 'boolean') {
        return renderCampoBooleano(chiave, valore, percorso);
    }

    // Valore semplice (numero) → campo input inline
    if (typeof valore === 'number') {
        return renderCampoSingolo(chiave, valore, percorso, 'number', false);
    }
    if (typeof valore === 'string') {
        return renderCampoSingolo(chiave, valore, percorso, 'text');
    }

    // Array tabellare (oggetti con valori semplici) → tabella editabile
    if (isArrayTabellare(valore)) {
        return renderArrayTabella(chiave, valore, percorso, livello);
    }

    // Array di valori semplici → lista editabile
    if (Array.isArray(valore) && valore.every(v => typeof v !== 'object')) {
        return renderArraySemplice(chiave, valore, percorso);
    }

    // Array di oggetti complessi → accordion con tabelle/pannelli
    if (Array.isArray(valore)) {
        return renderArrayComplesso(chiave, valore, percorso, livello);
    }

    // Oggetto con solo valori semplici → griglia di campi
    if (isOggettoSemplice(valore)) {
        return renderGrigliaCampi(chiave, valore, percorso, livello);
    }

    // Oggetto con sotto-sezioni (misto) → accordion collapsibile
    return renderAccordionSezione(chiave, valore, percorso, livello);
}

/**
 * Campo booleano (checkbox)
 */
function renderCampoBooleano(chiave, valore, percorso) {
    const checked = valore ? 'checked' : '';
    return `<div class="campo-singolo-wrapper">
        <label class="form-label small text-muted mb-0">${etichettaDaChiave(chiave)}</label>
        <div class="form-check mt-1">
            <input type="checkbox" class="form-check-input campo-editor-bool"
                   data-percorso="${percorso}" ${checked}>
            <label class="form-check-label small">${valore ? 'Si' : 'No'}</label>
        </div>
    </div>`;
}

/**
 * Campo singolo inline (label + input)
 */
function renderCampoSingolo(chiave, valore, percorso, tipo, isNull = false) {
    const isPrezzo = tipo === 'number' || (typeof valore === 'string' && /^\d+([.,]\d+)?$/.test(valore));
    const classePrezzo = isPrezzo ? 'campo-prezzo' : '';
    const inputTipo = tipo === 'number' ? 'number' : 'text';
    const step = inputTipo === 'number' ? 'step="any"' : '';
    const nullAttr = isNull ? 'data-null="1"' : '';

    return `<div class="campo-singolo-wrapper">
        <label class="form-label small text-muted mb-0">${etichettaDaChiave(chiave)}</label>
        <input type="${inputTipo}" class="form-control form-control-sm campo-editor ${classePrezzo}"
               data-percorso="${percorso}" value="${escapeHTML(valore)}" ${step} ${nullAttr}>
    </div>`;
}

/**
 * Griglia di campi per un oggetto con solo valori semplici
 */
function renderGrigliaCampi(chiave, oggetto, percorso, livello) {
    const entries = Object.entries(oggetto);
    // Se è dentro un accordion (livello > 0), non aggiungere header aggiuntivo
    const header = livello === 0
        ? `<h6 class="text-brand mt-3 mb-2">${etichettaDaChiave(chiave)}</h6>`
        : '';

    return `${header}
    <div class="griglia-campi row g-2 mb-3">
        ${entries.map(([k, v]) => {
            const isNull = v === null || v === undefined;
            const tipo = typeof v === 'number' ? 'number' : 'text';
            const step = tipo === 'number' ? 'step="any"' : '';
            const classePrezzo = tipo === 'number' ? 'campo-prezzo' : '';
            const nullAttr = isNull ? 'data-null="1"' : '';
            const colSize = entries.length <= 3 ? '4' : entries.length <= 6 ? '4' : '3';
            return `<div class="col-md-${colSize} col-sm-6">
                <label class="form-label small text-muted mb-0">${etichettaDaChiave(k)}</label>
                <input type="${tipo}" class="form-control form-control-sm campo-editor ${classePrezzo}"
                       data-percorso="${percorso}.${k}" value="${escapeHTML(v ?? '')}" ${step} ${nullAttr}>
            </div>`;
        }).join('')}
    </div>`;
}

/**
 * Tabella editabile per array di oggetti con valori semplici
 */
function renderArrayTabella(chiave, array, percorso, livello) {
    if (array.length === 0) return `<p class="text-muted small">Nessun elemento</p>`;

    // Raccoglie tutte le chiavi da tutti gli elementi (unione) preservando l'ordine
    const colonneSet = new Set();
    array.forEach(item => Object.keys(item).forEach(k => colonneSet.add(k)));
    const colonne = [...colonneSet];
    const header = livello === 0
        ? `<h6 class="text-brand mt-3 mb-2">${etichettaDaChiave(chiave)} <span class="badge bg-secondary ms-1">${array.length}</span></h6>`
        : `<div class="d-flex justify-content-between align-items-center mb-2">
               <small class="text-muted">${array.length} elementi</small>
           </div>`;

    return `${header}
    <div class="tabella-editor-wrapper mb-3">
        <div class="table-responsive" style="max-height:400px; overflow-y:auto">
            <table class="table table-sm table-bordered table-hover-editor mb-0" data-percorso="${percorso}" data-tipo="array-tabella">
                <thead class="table-light sticky-top">
                    <tr>
                        ${colonne.map(c => `<th class="small text-nowrap">${etichettaDaChiave(c)}</th>`).join('')}
                        <th style="width:40px"></th>
                    </tr>
                </thead>
                <tbody>
                    ${array.map((riga, i) => renderRigaTabella(riga, colonne, `${percorso}.${i}`, i)).join('')}
                </tbody>
            </table>
        </div>
        <button class="btn btn-outline-primary btn-sm mt-1 btn-aggiungi-riga" data-percorso="${percorso}" data-colonne="${escapeHTML(JSON.stringify(colonne))}">
            <i class="bi bi-plus-lg me-1"></i>Aggiungi
        </button>
    </div>`;
}

/**
 * Singola riga di tabella editabile
 */
function renderRigaTabella(riga, colonne, percorso, indice) {
    return `<tr data-percorso="${percorso}">
        ${colonne.map(col => {
            const valOrig = riga[col];
            const val = valOrig ?? '';
            const isNull = valOrig === null || valOrig === undefined;

            if (typeof valOrig === 'boolean') {
                const checked = valOrig ? 'checked' : '';
                return `<td class="text-center"><input type="checkbox" class="form-check-input campo-editor-bool"
                             data-percorso="${percorso}.${col}" ${checked}></td>`;
            }

            const tipo = typeof valOrig === 'number' ? 'number' : 'text';
            const step = tipo === 'number' ? 'step="any"' : '';
            const classePrezzo = tipo === 'number' ? 'campo-prezzo' : '';
            const nullAttr = isNull ? 'data-null="1"' : '';
            return `<td><input type="${tipo}" class="form-control form-control-sm campo-editor ${classePrezzo}"
                         data-percorso="${percorso}.${col}" value="${escapeHTML(val)}" ${step} ${nullAttr}></td>`;
        }).join('')}
        <td class="text-center align-middle">
            <button class="btn btn-sm btn-outline-danger btn-elimina-riga py-0 px-1" title="Elimina">
                <i class="bi bi-x-lg"></i>
            </button>
        </td>
    </tr>`;
}

/**
 * Array di valori semplici (lista editabile)
 */
function renderArraySemplice(chiave, array, percorso) {
    return `<div class="mb-3">
        <label class="form-label small text-muted">${etichettaDaChiave(chiave)}</label>
        <div class="lista-semplice" data-percorso="${percorso}" data-tipo="array-semplice">
            ${array.map((val, i) => `
                <div class="input-group input-group-sm mb-1">
                    <input type="text" class="form-control form-control-sm campo-editor"
                           data-percorso="${percorso}.${i}" value="${escapeHTML(val)}">
                    <button class="btn btn-outline-danger btn-elimina-item" type="button">
                        <i class="bi bi-x-lg"></i>
                    </button>
                </div>
            `).join('')}
            <button class="btn btn-outline-primary btn-sm mt-1 btn-aggiungi-item" data-percorso="${percorso}">
                <i class="bi bi-plus-lg me-1"></i>Aggiungi
            </button>
        </div>
    </div>`;
}

/**
 * Array di oggetti complessi → ogni oggetto come pannello accordion
 */
function renderArrayComplesso(chiave, array, percorso, livello) {
    const id = idAccordion();
    const header = livello === 0
        ? `<h6 class="text-brand mt-3 mb-2">${etichettaDaChiave(chiave)} <span class="badge bg-secondary ms-1">${array.length}</span></h6>`
        : '';

    return `${header}
    <div class="accordion accordion-flush accordion-nested mb-2" id="${id}" data-percorso="${percorso}" data-tipo="array-complesso">
        ${array.map((item, i) => {
            const titolo = item.modello || item.nome || item.codice || item.descrizione || `Elemento ${i + 1}`;
            const itemId = idAccordion();
            const contenuto = Object.entries(item).map(([k, v]) =>
                renderNodo(k, v, `${percorso}.${i}.${k}`, livello + 1)
            ).join('');

            return `<div class="accordion-item" data-percorso="${percorso}.${i}">
                <h2 class="accordion-header">
                    <button class="accordion-button collapsed accordion-btn-livello-${Math.min(livello + 1, 3)}" type="button"
                            data-bs-toggle="collapse" data-bs-target="#${itemId}">
                        ${escapeHTML(titolo)}
                    </button>
                </h2>
                <div id="${itemId}" class="accordion-collapse collapse" data-bs-parent="#${id}">
                    <div class="accordion-body py-2">${contenuto}</div>
                </div>
            </div>`;
        }).join('')}
    </div>`;
}

/**
 * Accordion per oggetto con sotto-sezioni miste
 */
function renderAccordionSezione(chiave, oggetto, percorso, livello) {
    const entries = Object.entries(oggetto);
    const id = idAccordion();

    // Se livello 0, usa un accordion senza header aggiuntivo
    const header = livello === 0
        ? `<h6 class="text-brand mt-3 mb-2">${etichettaDaChiave(chiave)}</h6>`
        : '';

    // Separa le note dagli altri valori
    const note = entries.filter(([k, v]) => isNota(k, v));
    const altri = entries.filter(([k, v]) => !isNota(k, v));

    // Se ci sono poche sotto-chiavi semplici, renderizza inline senza accordion
    const tuttiSemplici = altri.every(([, v]) => typeof v === 'number' || typeof v === 'string' || v === null);
    if (tuttiSemplici && altri.length <= 8) {
        const noteHtml = note.map(([k, v]) => renderNodo(k, v, `${percorso}.${k}`, livello + 1)).join('');
        const grigliaHtml = renderGrigliaCampi(chiave, Object.fromEntries(altri), percorso, livello);
        return noteHtml + grigliaHtml;
    }

    return `${header}
    ${note.map(([k, v]) => renderNodo(k, v, `${percorso}.${k}`, livello + 1)).join('')}
    <div class="accordion accordion-flush accordion-nested mb-2" id="${id}">
        ${altri.map(([k, v]) => {
            const itemId = idAccordion();
            const contenuto = renderNodo(k, v, `${percorso}.${k}`, livello + 1);
            // Conta elementi per badge
            const badge = Array.isArray(v) ? `<span class="badge bg-secondary ms-2">${v.length}</span>` :
                          (typeof v === 'object' && v !== null ? `<span class="badge bg-light text-dark ms-2">${Object.keys(v).length} campi</span>` : '');

            return `<div class="accordion-item">
                <h2 class="accordion-header">
                    <button class="accordion-button collapsed accordion-btn-livello-${Math.min(livello + 1, 3)}" type="button"
                            data-bs-toggle="collapse" data-bs-target="#${itemId}">
                        ${etichettaDaChiave(k)}${badge}
                    </button>
                </h2>
                <div id="${itemId}" class="accordion-collapse collapse" data-bs-parent="#${id}">
                    <div class="accordion-body py-2">${contenuto}</div>
                </div>
            </div>`;
        }).join('')}
    </div>`;
}

// ============================
// Raccolta dati dagli input
// ============================

/**
 * Ricostruisce l'oggetto JSON completo dai valori degli input
 */
function raccogliDati(container) {
    const risultato = {};

    // Raccogli tutti gli input con data-percorso
    container.querySelectorAll('.campo-editor[data-percorso]').forEach(input => {
        const percorso = input.dataset.percorso;
        let val;
        // Se il campo era originariamente null e l'utente non ha inserito nulla, preserva null
        if (input.dataset.null === '1' && input.value === '') {
            val = null;
        } else if (input.type === 'number' && input.value !== '') {
            val = parseFloat(input.value);
        } else {
            val = input.value;
        }
        impostaValore(risultato, percorso, val);
    });

    // Raccogli i checkbox booleani
    container.querySelectorAll('.campo-editor-bool[data-percorso]').forEach(input => {
        const percorso = input.dataset.percorso;
        impostaValore(risultato, percorso, input.checked);
    });

    // Raccogli le note non editabili
    container.querySelectorAll('.nota-listino[data-percorso]').forEach(el => {
        const percorso = el.dataset.percorso;
        const testo = el.querySelector('span')?.textContent || '';
        impostaValore(risultato, percorso, testo);
    });

    // Ricostruisci struttura, convertendo gli indici numerici in array
    return ricostruisciStruttura(risultato);
}

/**
 * Imposta un valore in un oggetto usando un percorso dotted
 */
function impostaValore(obj, percorso, valore) {
    const parti = percorso.split('.');
    let corrente = obj;
    for (let i = 0; i < parti.length - 1; i++) {
        const parte = parti[i];
        if (!(parte in corrente)) {
            corrente[parte] = {};
        }
        corrente = corrente[parte];
    }
    corrente[parti[parti.length - 1]] = valore;
}

/**
 * Converte oggetti con chiavi numeriche consecutive in array
 */
function ricostruisciStruttura(obj) {
    if (typeof obj !== 'object' || obj === null) return obj;

    const chiavi = Object.keys(obj);
    // Verifica se tutte le chiavi sono indici numerici consecutivi
    const isArray = chiavi.length > 0 && chiavi.every(k => /^\d+$/.test(k));
    if (isArray) {
        const arr = [];
        // Ordina per indice numerico
        const indici = chiavi.map(Number).sort((a, b) => a - b);
        for (const i of indici) {
            arr.push(ricostruisciStruttura(obj[String(i)]));
        }
        return arr;
    }

    const risultato = {};
    for (const [k, v] of Object.entries(obj)) {
        risultato[k] = ricostruisciStruttura(v);
    }
    return risultato;
}

// ============================
// Entry point
// ============================

export async function apriEditorTabella(sezione, nomeVisualizzato, onSalvato) {
    contatorAccordion = 0;

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
        const [risultato, backup] = await Promise.all([
            api.get(`/admin/listino/${sezione}`),
            api.get(`/admin/listino/${sezione}/backup`).catch(() => [])
        ]);

        renderEditorCompleto(risultato.dati, sezione, backup, nomeVisualizzato);
    } catch (err) {
        document.getElementById('modale-admin-corpo').innerHTML =
            `<div class="alert alert-danger">${err.message}</div>`;
    }
}

function renderEditorCompleto(dati, sezione, backup, nomeVisualizzato) {
    const corpo = document.getElementById('modale-admin-corpo');
    contatorAccordion = 0;

    // Genera HTML dal renderer ricorsivo
    // Per gli oggetti root, ogni chiave di primo livello parte con percorso = chiave stessa
    // Per gli array root, wrappa in un percorso "dati" e il salvataggio estrae dati.dati
    let contenutoHTML = '';
    let rootIsArray = false;
    if (Array.isArray(dati)) {
        rootIsArray = true;
        contenutoHTML = renderNodo('dati', dati, '_root_', 0);
    } else if (typeof dati === 'object' && dati !== null) {
        contenutoHTML = Object.entries(dati).map(([k, v]) =>
            renderNodo(k, v, k, 0)
        ).join('');
    } else {
        contenutoHTML = renderNodo('valore', dati, 'valore', 0);
    }
    // Salva flag per il salvataggio
    corpo.dataset.rootArray = rootIsArray ? '1' : '0';

    corpo.innerHTML = `
        <div class="editor-tabellare-universale">
            <!-- Toolbar -->
            <div class="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
                <div class="d-flex gap-2 align-items-center">
                    <button class="btn btn-outline-secondary btn-sm" id="btn-toggle-json" title="Visualizza JSON">
                        <i class="bi bi-code-square me-1"></i>JSON
                    </button>
                    <button class="btn btn-outline-secondary btn-sm" id="btn-espandi-tutto" title="Espandi tutte le sezioni">
                        <i class="bi bi-arrows-expand me-1"></i>Espandi
                    </button>
                    <button class="btn btn-outline-secondary btn-sm" id="btn-comprimi-tutto" title="Comprimi tutte le sezioni">
                        <i class="bi bi-arrows-collapse me-1"></i>Comprimi
                    </button>
                </div>
                <div class="d-flex gap-2">
                    <button class="btn btn-outline-warning btn-sm" id="btn-importa-file" title="Reimporta da file originale">
                        <i class="bi bi-arrow-repeat me-1"></i>Reimporta da file
                    </button>
                </div>
            </div>

            <!-- Contenuto tabellare -->
            <div id="contenuto-tabellare">${contenutoHTML}</div>

            <!-- Preview JSON (nascosta) -->
            <div id="preview-json" style="display:none">
                <pre class="bg-light border rounded p-3 small" style="max-height:500px; overflow:auto; font-size:0.75rem"><code id="json-preview-code"></code></pre>
            </div>

            <!-- Backup -->
            ${Array.isArray(backup) && backup.length > 0 ? `
                <div class="mt-3 border-top pt-3">
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

    // ---- Bind eventi ----
    bindEventi(corpo, sezione, nomeVisualizzato);
}

function bindEventi(corpo, sezione, nomeVisualizzato) {
    // Elimina riga tabella
    corpo.addEventListener('click', (e) => {
        const btnElimina = e.target.closest('.btn-elimina-riga');
        if (btnElimina) {
            e.preventDefault();
            btnElimina.closest('tr').remove();
            return;
        }

        // Elimina item da lista semplice
        const btnEliminaItem = e.target.closest('.btn-elimina-item');
        if (btnEliminaItem) {
            e.preventDefault();
            btnEliminaItem.closest('.input-group').remove();
            return;
        }

        // Aggiungi riga tabella
        const btnAggiungi = e.target.closest('.btn-aggiungi-riga');
        if (btnAggiungi) {
            e.preventDefault();
            const percorso = btnAggiungi.dataset.percorso;
            const colonne = JSON.parse(btnAggiungi.dataset.colonne);
            const tabella = corpo.querySelector(`table[data-percorso="${percorso}"] tbody`);
            if (tabella) {
                // Calcola indice più alto + 1 per evitare collisioni dopo eliminazioni
                let maxIdx = -1;
                tabella.querySelectorAll('tr[data-percorso]').forEach(tr => {
                    const trPerc = tr.dataset.percorso;
                    const idx = parseInt(trPerc.split('.').pop());
                    if (idx > maxIdx) maxIdx = idx;
                });
                const indice = maxIdx + 1;
                const nuovaRiga = {};
                colonne.forEach(c => { nuovaRiga[c] = ''; });
                const html = renderRigaTabella(nuovaRiga, colonne, `${percorso}.${indice}`, indice);
                tabella.insertAdjacentHTML('beforeend', html);
            }
            return;
        }

        // Aggiungi item a lista semplice
        const btnAggiungiItem = e.target.closest('.btn-aggiungi-item');
        if (btnAggiungiItem) {
            e.preventDefault();
            const lista = btnAggiungiItem.closest('.lista-semplice');
            const indice = lista.querySelectorAll('.input-group').length;
            const percorso = btnAggiungiItem.dataset.percorso;
            const html = `<div class="input-group input-group-sm mb-1">
                <input type="text" class="form-control form-control-sm campo-editor"
                       data-percorso="${percorso}.${indice}" value="">
                <button class="btn btn-outline-danger btn-elimina-item" type="button">
                    <i class="bi bi-x-lg"></i>
                </button>
            </div>`;
            btnAggiungiItem.insertAdjacentHTML('beforebegin', html);
            return;
        }
    });

    // Toggle JSON preview
    const btnJSON = corpo.querySelector('#btn-toggle-json');
    const previewJSON = corpo.querySelector('#preview-json');
    const contenutoTab = corpo.querySelector('#contenuto-tabellare');

    btnJSON?.addEventListener('click', () => {
        if (previewJSON.style.display === 'none') {
            // Raccogli dati e mostra JSON
            let dati = raccogliDati(corpo.querySelector('.editor-tabellare-universale'));
            const corpoModale = document.getElementById('modale-admin-corpo');
            if (corpoModale?.dataset.rootArray === '1' && dati._root_) {
                dati = dati._root_;
            }
            const jsonCode = corpo.querySelector('#json-preview-code');
            jsonCode.textContent = JSON.stringify(dati, null, 2);
            previewJSON.style.display = 'block';
            contenutoTab.style.display = 'none';
            btnJSON.innerHTML = '<i class="bi bi-table me-1"></i>Tabella';
            btnJSON.classList.replace('btn-outline-secondary', 'btn-outline-primary');
        } else {
            previewJSON.style.display = 'none';
            contenutoTab.style.display = 'block';
            btnJSON.innerHTML = '<i class="bi bi-code-square me-1"></i>JSON';
            btnJSON.classList.replace('btn-outline-primary', 'btn-outline-secondary');
        }
    });

    // Espandi/comprimi tutto
    corpo.querySelector('#btn-espandi-tutto')?.addEventListener('click', () => {
        corpo.querySelectorAll('.accordion-collapse').forEach(el => {
            const bsCollapse = bootstrap.Collapse.getOrCreateInstance(el, { toggle: false });
            bsCollapse.show();
        });
    });

    corpo.querySelector('#btn-comprimi-tutto')?.addEventListener('click', () => {
        corpo.querySelectorAll('.accordion-collapse.show').forEach(el => {
            const bsCollapse = bootstrap.Collapse.getOrCreateInstance(el, { toggle: false });
            bsCollapse.hide();
        });
    });

    // Reimporta da file
    corpo.querySelector('#btn-importa-file')?.addEventListener('click', async () => {
        if (!confirm('Reimportare i dati dal file originale? I dati attuali nel modale verranno sovrascritti.')) return;
        try {
            const risultato = await api.post(`/admin/listino/${sezione}/importa`);
            renderEditorCompleto(risultato.dati, sezione, [], nomeVisualizzato);
            mostraNotifica('Dati reimportati dal file', 'success');
        } catch (err) {
            mostraNotifica(err.message, 'danger');
        }
    });

    // Ripristina backup
    corpo.querySelectorAll('.btn-ripristina').forEach(btn => {
        btn.addEventListener('click', async () => {
            if (!confirm('Ripristinare questo backup? I dati attuali nel modale verranno sovrascritti.')) return;
            try {
                const risultato = await api.post(`/admin/listino/${sezione}/ripristina`, {
                    backup_id: parseInt(btn.dataset.id)
                });
                renderEditorCompleto(risultato.dati, sezione, [], nomeVisualizzato);
                mostraNotifica('Backup ripristinato', 'success');
            } catch (err) {
                mostraNotifica(err.message, 'danger');
            }
        });
    });
}

async function salva(sezione, modale) {
    const corpo = document.getElementById('modale-admin-corpo');
    const editor = corpo.querySelector('.editor-tabellare-universale');
    let dati = raccogliDati(editor);

    // Se il dato originale era un array, è stato wrappato in _root_
    if (corpo.dataset.rootArray === '1' && dati._root_) {
        dati = dati._root_;
    }

    await api.put(`/admin/listino/${sezione}`, { dati });
    modale.hide();
    mostraNotifica('Listino aggiornato', 'success');
}
