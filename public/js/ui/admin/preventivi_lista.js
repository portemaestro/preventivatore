// Lista preventivi admin con filtri, ricerca e paginazione
import { api } from '../../api.js';
import { AGENZIE } from '../../config.js';
import {
    creaTabellaAdmin, creaPaginazione, creaBarraRicerca,
    creaBadgeStato, mostraNotifica, creaModale
} from './componenti_admin.js';
import { apriDettaglioPreventivo } from './preventivo_dettaglio.js';

let stato = { pagina: 1, cerca: '', agenzia: '', stato_filtro: '', data_da: '', data_a: '' };

export function renderPreventiviLista(container) {
    container.innerHTML = `
        <div class="d-flex justify-content-between align-items-center mb-3">
            <h5 class="mb-0"><i class="bi bi-file-earmark-text me-2"></i>Gestione Preventivi</h5>
        </div>
        <div id="preventivi-filtri"></div>
        <div class="row g-2 mb-3">
            <div class="col-md-3">
                <label class="form-label small text-muted mb-1">Data da</label>
                <input type="date" class="form-control form-control-sm" id="filtro-data-da">
            </div>
            <div class="col-md-3">
                <label class="form-label small text-muted mb-1">Data a</label>
                <input type="date" class="form-control form-control-sm" id="filtro-data-a">
            </div>
        </div>
        <div class="card">
            <div class="card-body p-0" id="preventivi-tabella">
                <div class="text-center py-4">
                    <div class="spinner-border spinner-border-sm text-primary"></div>
                    <span class="ms-2 text-muted">Caricamento...</span>
                </div>
            </div>
            <div class="card-footer" id="preventivi-paginazione"></div>
        </div>
    `;

    // Barra ricerca + filtri
    const barraRicerca = creaBarraRicerca({
        placeholder: 'Cerca per numero o ragione sociale...',
        onRicerca: (testo) => { stato.cerca = testo; stato.pagina = 1; caricaDati(container); },
        filtri: [
            {
                nome: 'stato_filtro',
                etichetta: 'Tutti gli stati',
                opzioni: [
                    { valore: 'bozza', testo: 'Bozze' },
                    { valore: 'preventivo', testo: 'Preventivi' },
                    { valore: 'ordine', testo: 'Ordini' }
                ]
            },
            {
                nome: 'agenzia',
                etichetta: 'Tutte le agenzie',
                opzioni: AGENZIE.map(a => ({ valore: a, testo: a }))
            }
        ],
        onFiltro: (nome, valore) => { stato[nome] = valore; stato.pagina = 1; caricaDati(container); }
    });
    document.getElementById('preventivi-filtri').appendChild(barraRicerca);

    // Bind filtri date
    document.getElementById('filtro-data-da').addEventListener('change', (e) => {
        stato.data_da = e.target.value; stato.pagina = 1; caricaDati(container);
    });
    document.getElementById('filtro-data-a').addEventListener('change', (e) => {
        stato.data_a = e.target.value; stato.pagina = 1; caricaDati(container);
    });

    caricaDati(container);
}

function formattaData(val) {
    if (!val) return '';
    const d = new Date(val);
    return d.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function formattaPrezzo(val) {
    if (!val || parseFloat(val) === 0) return '-';
    return parseFloat(val).toLocaleString('it-IT', { style: 'currency', currency: 'EUR' });
}

async function caricaDati(container) {
    const tabellaEl = document.getElementById('preventivi-tabella');
    const pagEl = document.getElementById('preventivi-paginazione');

    try {
        const params = new URLSearchParams({
            pagina: stato.pagina,
            per_pagina: 20
        });
        if (stato.cerca) params.set('cerca', stato.cerca);
        if (stato.stato_filtro) params.set('stato', stato.stato_filtro);
        if (stato.agenzia) params.set('agenzia', stato.agenzia);
        if (stato.data_da) params.set('data_da', stato.data_da);
        if (stato.data_a) params.set('data_a', stato.data_a);

        const risultato = await api.get(`/preventivi?${params}`);
        const { dati, paginazione } = risultato;

        const tabella = creaTabellaAdmin({
            colonne: [
                { chiave: 'numero', etichetta: 'N.', larghezza: '80px',
                  formato: (v) => `<strong>#${v}</strong>` },
                { chiave: 'stato', etichetta: 'Stato', larghezza: '90px',
                  formato: (v) => creaBadgeStato(v) },
                { chiave: 'ragione_sociale', etichetta: 'Cliente' },
                { chiave: 'agenzia', etichetta: 'Agenzia' },
                { chiave: 'data_creazione', etichetta: 'Data', larghezza: '100px',
                  formato: (v) => formattaData(v) },
                { chiave: 'totale', etichetta: 'Totale', larghezza: '110px',
                  formato: (v) => formattaPrezzo(v) }
            ],
            righe: dati,
            azioni: [
                {
                    icona: 'bi-eye',
                    classe: 'btn-outline-primary',
                    titolo: 'Dettaglio',
                    onClick: (id) => apriDettaglioPreventivo(id, () => caricaDati(container))
                },
                {
                    icona: 'bi-trash',
                    classe: 'btn-outline-danger',
                    titolo: 'Elimina',
                    onClick: (id, riga) => eliminaPreventivo(id, riga, container)
                }
            ],
            onClickRiga: (id) => apriDettaglioPreventivo(id, () => caricaDati(container))
        });

        tabellaEl.innerHTML = '';
        tabellaEl.appendChild(tabella);

        const info = document.createElement('div');
        info.className = 'px-3 py-2 text-muted small border-top';
        info.textContent = `${paginazione.totale} preventiv${paginazione.totale === 1 ? 'o' : 'i'} trovati`;
        tabellaEl.appendChild(info);

        pagEl.innerHTML = '';
        pagEl.appendChild(creaPaginazione({
            pagina: paginazione.pagina,
            totale: paginazione.totale_pagine,
            onChange: (p) => { stato.pagina = p; caricaDati(container); }
        }));

    } catch (err) {
        tabellaEl.innerHTML = `<div class="alert alert-danger m-3">${err.message}</div>`;
    }
}

async function eliminaPreventivo(id, riga, container) {
    if (riga?.stato !== 'bozza') {
        mostraNotifica('Solo le bozze possono essere eliminate', 'warning');
        return;
    }

    creaModale({
        titolo: 'Conferma eliminazione',
        corpo: `<p>Eliminare definitivamente la bozza <strong>#${riga.numero}</strong>?</p>
                <p class="text-muted small">Questa azione non è reversibile.</p>`,
        testoSalva: 'Elimina',
        onSalva: async (modale) => {
            await api.delete(`/preventivi/${id}`);
            modale.hide();
            mostraNotifica('Bozza eliminata', 'success');
            caricaDati(container);
        }
    });
}
