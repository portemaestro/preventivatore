// Lista rivenditori con ricerca, filtro e paginazione
import { api } from '../../api.js';
import { AGENZIE } from '../../config.js';
import {
    creaTabellaAdmin, creaPaginazione, creaBarraRicerca, mostraNotifica, creaModale
} from './componenti_admin.js';
import { apriFormRivenditore } from './rivenditore_form.js';

let stato = { pagina: 1, cerca: '', agenzia: '' };

export function renderRivenditoriLista(container) {
    container.innerHTML = `
        <div class="d-flex justify-content-between align-items-center mb-3">
            <h5 class="mb-0"><i class="bi bi-people me-2"></i>Gestione Rivenditori</h5>
            <button class="btn btn-primary btn-sm" id="btn-nuovo-rivenditore">
                <i class="bi bi-plus-lg me-1"></i>Nuovo Rivenditore
            </button>
        </div>
        <div id="rivenditori-filtri"></div>
        <div class="card">
            <div class="card-body p-0" id="rivenditori-tabella">
                <div class="text-center py-4">
                    <div class="spinner-border spinner-border-sm text-primary"></div>
                    <span class="ms-2 text-muted">Caricamento...</span>
                </div>
            </div>
            <div class="card-footer" id="rivenditori-paginazione"></div>
        </div>
    `;

    // Barra ricerca + filtri
    const barraRicerca = creaBarraRicerca({
        placeholder: 'Cerca ragione sociale, città, P.IVA...',
        onRicerca: (testo) => { stato.cerca = testo; stato.pagina = 1; caricaDati(container); },
        filtri: [
            {
                nome: 'agenzia',
                etichetta: 'Tutte le agenzie',
                opzioni: AGENZIE.map(a => ({ valore: a, testo: a }))
            }
        ],
        onFiltro: (nome, valore) => { stato[nome] = valore; stato.pagina = 1; caricaDati(container); }
    });
    document.getElementById('rivenditori-filtri').appendChild(barraRicerca);

    // Bottone nuovo
    document.getElementById('btn-nuovo-rivenditore').addEventListener('click', () => {
        apriFormRivenditore(null, () => caricaDati(container));
    });

    caricaDati(container);
}

async function caricaDati(container) {
    const tabellaEl = document.getElementById('rivenditori-tabella');
    const pagEl = document.getElementById('rivenditori-paginazione');

    try {
        const params = new URLSearchParams({
            pagina: stato.pagina,
            per_pagina: 20
        });
        if (stato.cerca) params.set('cerca', stato.cerca);
        if (stato.agenzia) params.set('agenzia', stato.agenzia);

        const risultato = await api.get(`/rivenditori?${params}`);
        const { dati, paginazione } = risultato;

        const tabella = creaTabellaAdmin({
            colonne: [
                { chiave: 'ragione_sociale', etichetta: 'Ragione Sociale' },
                { chiave: 'citta', etichetta: 'Città' },
                { chiave: 'provincia', etichetta: 'Prov.', larghezza: '60px' },
                { chiave: 'agenzia', etichetta: 'Agenzia' },
                { chiave: 'sconto_default', etichetta: 'Sconto', larghezza: '80px' },
                {
                    chiave: 'username',
                    etichetta: 'Accesso',
                    larghezza: '100px',
                    formato: (val) => val
                        ? `<span class="badge bg-success"><i class="bi bi-check-circle me-1"></i>${val}</span>`
                        : '<span class="badge bg-secondary">No</span>'
                }
            ],
            righe: dati,
            azioni: [
                {
                    icona: 'bi-pencil',
                    classe: 'btn-outline-primary',
                    titolo: 'Modifica',
                    onClick: (id, riga) => apriFormRivenditore(riga, () => caricaDati(container))
                },
                {
                    icona: 'bi-trash',
                    classe: 'btn-outline-danger',
                    titolo: 'Elimina',
                    onClick: (id, riga) => eliminaRivenditore(id, riga, container)
                }
            ],
            onClickRiga: (id, riga) => apriFormRivenditore(riga, () => caricaDati(container))
        });

        tabellaEl.innerHTML = '';
        tabellaEl.appendChild(tabella);

        // Info totale
        const info = document.createElement('div');
        info.className = 'px-3 py-2 text-muted small border-top';
        info.textContent = `${paginazione.totale} rivenditor${paginazione.totale === 1 ? 'e' : 'i'} trovati`;
        tabellaEl.appendChild(info);

        // Paginazione
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

function eliminaRivenditore(id, riga, container) {
    creaModale({
        titolo: 'Conferma eliminazione',
        corpo: `<p>Eliminare definitivamente il rivenditore <strong>${riga.ragione_sociale}</strong>?</p>
                <p class="text-muted small">L'eventuale utente di accesso collegato verrà eliminato. L'operazione non è reversibile.</p>`,
        testoSalva: 'Elimina',
        onSalva: async (modale) => {
            await api.delete(`/rivenditori/${id}`);
            modale.hide();
            mostraNotifica('Rivenditore eliminato', 'success');
            caricaDati(container);
        }
    });
}
