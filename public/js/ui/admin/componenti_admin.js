// Componenti riusabili per l'area admin

/**
 * Crea una tabella responsive con azioni per riga
 * @param {object} config
 * @param {Array<{chiave, etichetta, larghezza?, formato?}>} config.colonne
 * @param {Array<object>} config.righe
 * @param {Array<{icona, classe, titolo, onClick}>} config.azioni - azioni per riga
 * @param {string} config.chiaveId - campo ID per le righe (default: 'id')
 * @param {Function} config.onClickRiga - callback click riga
 */
export function creaTabellaAdmin({ colonne, righe, azioni = [], chiaveId = 'id', onClickRiga }) {
    const tabella = document.createElement('div');
    tabella.className = 'table-responsive';

    const thead = colonne.map(c =>
        `<th style="${c.larghezza ? `width:${c.larghezza}` : ''}">${c.etichetta}</th>`
    ).join('');

    const azioniTh = azioni.length ? '<th style="width:120px" class="text-center">Azioni</th>' : '';

    const tbody = righe.map(riga => {
        const cells = colonne.map(c => {
            const valore = c.formato ? c.formato(riga[c.chiave], riga) : (riga[c.chiave] ?? '');
            return `<td>${valore}</td>`;
        }).join('');

        const azioniTd = azioni.length ? `<td class="text-center text-nowrap">${
            azioni.map(a =>
                `<button class="btn btn-sm ${a.classe} me-1 btn-azione"
                         data-azione="${a.titolo}" data-id="${riga[chiaveId]}"
                         title="${a.titolo}">
                    <i class="bi ${a.icona}"></i>
                </button>`
            ).join('')
        }</td>` : '';

        const clickClass = onClickRiga ? 'cursor-pointer riga-hover' : '';
        return `<tr class="${clickClass}" data-id="${riga[chiaveId]}">${cells}${azioniTd}</tr>`;
    }).join('');

    const vuoto = righe.length === 0
        ? '<tr><td colspan="99" class="text-center text-muted py-4">Nessun elemento trovato</td></tr>'
        : '';

    tabella.innerHTML = `
        <table class="table table-hover table-admin mb-0">
            <thead><tr>${thead}${azioniTh}</tr></thead>
            <tbody>${tbody || vuoto}</tbody>
        </table>
    `;

    // Bind azioni
    if (azioni.length) {
        tabella.querySelectorAll('.btn-azione').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = btn.dataset.id;
                const nomeAzione = btn.dataset.azione;
                const azione = azioni.find(a => a.titolo === nomeAzione);
                if (azione?.onClick) azione.onClick(id, righe.find(r => String(r[chiaveId]) === id));
            });
        });
    }

    // Bind click riga
    if (onClickRiga) {
        tabella.querySelectorAll('tbody tr[data-id]').forEach(tr => {
            tr.addEventListener('click', () => {
                const id = tr.dataset.id;
                onClickRiga(id, righe.find(r => String(r[chiaveId]) === id));
            });
        });
    }

    return tabella;
}

/**
 * Crea paginazione Bootstrap
 * @param {object} config
 * @param {number} config.pagina - pagina corrente (1-based)
 * @param {number} config.totale - totale pagine
 * @param {Function} config.onChange - callback(nuovaPagina)
 */
export function creaPaginazione({ pagina, totale, onChange }) {
    if (totale <= 1) return document.createElement('div');

    const nav = document.createElement('nav');
    nav.setAttribute('aria-label', 'Navigazione pagine');

    const pagineDaMostrare = [];
    const inizio = Math.max(1, pagina - 2);
    const fine = Math.min(totale, pagina + 2);

    if (inizio > 1) pagineDaMostrare.push(1);
    if (inizio > 2) pagineDaMostrare.push('...');
    for (let i = inizio; i <= fine; i++) pagineDaMostrare.push(i);
    if (fine < totale - 1) pagineDaMostrare.push('...');
    if (fine < totale) pagineDaMostrare.push(totale);

    nav.innerHTML = `
        <ul class="pagination pagination-sm justify-content-center mb-0">
            <li class="page-item ${pagina <= 1 ? 'disabled' : ''}">
                <a class="page-link" href="#" data-pagina="${pagina - 1}">&laquo;</a>
            </li>
            ${pagineDaMostrare.map(p => {
                if (p === '...') return '<li class="page-item disabled"><span class="page-link">...</span></li>';
                return `<li class="page-item ${p === pagina ? 'active' : ''}">
                    <a class="page-link" href="#" data-pagina="${p}">${p}</a>
                </li>`;
            }).join('')}
            <li class="page-item ${pagina >= totale ? 'disabled' : ''}">
                <a class="page-link" href="#" data-pagina="${pagina + 1}">&raquo;</a>
            </li>
        </ul>
    `;

    nav.querySelectorAll('.page-link[data-pagina]').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const p = parseInt(link.dataset.pagina);
            if (p >= 1 && p <= totale && p !== pagina) onChange(p);
        });
    });

    return nav;
}

/**
 * Crea un modale Bootstrap
 * @param {object} config
 * @param {string} config.titolo
 * @param {string|HTMLElement} config.corpo
 * @param {Function} config.onSalva - callback al salvataggio
 * @param {string} config.testoSalva - testo bottone salva (default: 'Salva')
 * @param {string} config.grandezza - 'sm', 'lg', 'xl' (default: '')
 */
export function creaModale({ titolo, corpo, onSalva, testoSalva = 'Salva', grandezza = '' }) {
    // Rimuovi modale precedente se esiste
    const vecchio = document.getElementById('modale-admin');
    if (vecchio) vecchio.remove();
    const vecchioBackdrop = document.querySelector('.modal-backdrop');
    if (vecchioBackdrop) vecchioBackdrop.remove();

    const div = document.createElement('div');
    div.id = 'modale-admin';
    div.className = 'modal fade';
    div.tabIndex = -1;
    div.innerHTML = `
        <div class="modal-dialog ${grandezza ? 'modal-' + grandezza : ''}">
            <div class="modal-content">
                <div class="modal-header bg-brand text-white">
                    <h5 class="modal-title">${titolo}</h5>
                    <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body" id="modale-admin-corpo"></div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Annulla</button>
                    <button type="button" class="btn btn-primary" id="modale-admin-salva">
                        ${testoSalva}
                    </button>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(div);

    const corpoContainer = div.querySelector('#modale-admin-corpo');
    if (typeof corpo === 'string') {
        corpoContainer.innerHTML = corpo;
    } else if (corpo instanceof HTMLElement) {
        corpoContainer.appendChild(corpo);
    }

    const modale = new bootstrap.Modal(div);

    if (onSalva) {
        div.querySelector('#modale-admin-salva').addEventListener('click', async () => {
            const btnSalva = div.querySelector('#modale-admin-salva');
            btnSalva.disabled = true;
            btnSalva.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span>Salvataggio...';
            try {
                await onSalva(modale);
            } catch (err) {
                // Mostra errore nel modale
                let alertErr = corpoContainer.querySelector('.alert-danger');
                if (!alertErr) {
                    alertErr = document.createElement('div');
                    alertErr.className = 'alert alert-danger mt-2';
                    corpoContainer.prepend(alertErr);
                }
                alertErr.textContent = err.message;
            } finally {
                btnSalva.disabled = false;
                btnSalva.textContent = testoSalva;
            }
        });
    }

    // Cleanup quando il modale si chiude
    div.addEventListener('hidden.bs.modal', () => {
        div.remove();
    });

    modale.show();
    return modale;
}

/**
 * Crea barra di ricerca con filtri
 * @param {object} config
 * @param {string} config.placeholder
 * @param {Function} config.onRicerca - callback(testo)
 * @param {Array<{nome, etichetta, opzioni: Array<{valore, testo}>}>} config.filtri
 * @param {Function} config.onFiltro - callback(nomeFiltro, valore)
 */
export function creaBarraRicerca({ placeholder = 'Cerca...', onRicerca, filtri = [], onFiltro }) {
    const div = document.createElement('div');
    div.className = 'row g-2 mb-3 align-items-end';

    const colRicerca = filtri.length > 0 ? 'col-md-4' : 'col-md-6';

    let filtriHTML = filtri.map(f => `
        <div class="col-md">
            <select class="form-select form-select-sm filtro-admin" data-filtro="${f.nome}">
                <option value="">${f.etichetta}</option>
                ${f.opzioni.map(o => `<option value="${o.valore}">${o.testo}</option>`).join('')}
            </select>
        </div>
    `).join('');

    div.innerHTML = `
        <div class="${colRicerca}">
            <div class="input-group input-group-sm">
                <span class="input-group-text"><i class="bi bi-search"></i></span>
                <input type="text" class="form-control" placeholder="${placeholder}" id="ricerca-admin">
            </div>
        </div>
        ${filtriHTML}
    `;

    // Bind ricerca con debounce
    let timer;
    const input = div.querySelector('#ricerca-admin');
    input.addEventListener('input', () => {
        clearTimeout(timer);
        timer = setTimeout(() => {
            if (onRicerca) onRicerca(input.value.trim());
        }, 300);
    });

    // Bind filtri
    div.querySelectorAll('.filtro-admin').forEach(sel => {
        sel.addEventListener('change', () => {
            if (onFiltro) onFiltro(sel.dataset.filtro, sel.value);
        });
    });

    return div;
}

/**
 * Crea badge colorato per stato preventivo
 * @param {string} stato - 'bozza', 'preventivo', 'ordine'
 */
export function creaBadgeStato(stato) {
    const mappa = {
        'bozza': 'bg-warning text-dark',
        'preventivo': 'bg-info text-dark',
        'ordine': 'bg-success'
    };
    const classe = mappa[stato] || 'bg-secondary';
    return `<span class="badge ${classe}">${stato}</span>`;
}

/**
 * Mostra notifica toast
 * @param {string} messaggio
 * @param {string} tipo - 'success', 'danger', 'warning', 'info'
 */
export function mostraNotifica(messaggio, tipo = 'success') {
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        container.className = 'toast-container position-fixed top-0 end-0 p-3';
        container.style.zIndex = '1080';
        document.body.appendChild(container);
    }

    const icone = {
        success: 'bi-check-circle-fill',
        danger: 'bi-exclamation-triangle-fill',
        warning: 'bi-exclamation-circle-fill',
        info: 'bi-info-circle-fill'
    };

    const toast = document.createElement('div');
    toast.className = `toast align-items-center text-bg-${tipo} border-0`;
    toast.setAttribute('role', 'alert');
    toast.innerHTML = `
        <div class="d-flex">
            <div class="toast-body">
                <i class="bi ${icone[tipo] || icone.info} me-2"></i>${messaggio}
            </div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
        </div>
    `;

    container.appendChild(toast);
    const bsToast = new bootstrap.Toast(toast, { delay: 3000 });
    bsToast.show();
    toast.addEventListener('hidden.bs.toast', () => toast.remove());
}
