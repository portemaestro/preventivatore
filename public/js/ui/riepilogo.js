// Pannello riepilogo laterale sticky con calcolo live
import { getStato, aggiornaStato } from '../stato.js';
import { calcolaRiepilogoCompleto } from '../calcolo_prezzi.js';
import { formattaEuro, formattaPrezzo } from '../utils/formattazione.js';
import { validaPreventivo } from '../utils/validazione.js';
import { api } from '../api.js';
import { getUtente, isAdmin } from '../auth.js';

const REGIONI = [
    { value: 'puglia', text: 'Puglia' },
    { value: 'campania_basilicata_calabria_molise', text: 'Campania / Basilicata / Calabria / Molise' },
    { value: 'emilia_romagna_toscana_umbria_lazio_abruzzo_marche', text: 'Emilia R. / Toscana / Umbria / Lazio / Abruzzo / Marche' },
    { value: 'lombardia_piemonte', text: 'Lombardia / Piemonte' },
    { value: 'veneto_sicilia_liguria', text: 'Veneto / Sicilia / Liguria' },
    { value: 'valle_aosta_trentino_friuli_sardegna', text: 'Valle d\'Aosta / Trentino / Friuli / Sardegna' }
];

let ultimoCalcolo = null;

export function renderRiepilogo(container) {
    container.innerHTML = `
        <div class="riepilogo-card card shadow-sm">
            <div class="card-header">
                <i class="bi bi-calculator me-2"></i>Riepilogo Preventivo
            </div>
            <div class="card-body" id="riepilogo-body">
            </div>
            <div class="card-footer bg-transparent">
                <div class="d-grid gap-2">
                    <button class="btn btn-outline-primary btn-sm" id="btn-salva-bozza">
                        <i class="bi bi-save me-1"></i>Salva Bozza
                    </button>
                    <button class="btn btn-primary" id="btn-crea-preventivo">
                        <i class="bi bi-file-earmark-check me-1"></i>Crea Preventivo
                    </button>
                </div>
                <div id="riepilogo-feedback" class="mt-2"></div>
            </div>
        </div>
    `;

    // Aggiorna calcolo
    aggiornaRiepilogo();

    // Ascolta cambiamenti di stato
    window.addEventListener('stato-aggiornato', aggiornaRiepilogo);

    // Bind bottoni
    document.getElementById('btn-salva-bozza')?.addEventListener('click', () => salvaPreventivo('bozza'));
    document.getElementById('btn-crea-preventivo')?.addEventListener('click', () => salvaPreventivo('preventivo'));
}

export function renderRiepilogoMobile(container) {
    container.innerHTML = `
        <div>
            <small>Totale IVA incl.</small>
            <div class="totale-mobile" id="totale-mobile">€ 0,00</div>
        </div>
        <button class="btn btn-light btn-sm" id="btn-salva-mobile">
            <i class="bi bi-save me-1"></i>Salva
        </button>
    `;

    window.addEventListener('stato-aggiornato', aggiornaTotaleMobile);
    aggiornaTotaleMobile();

    document.getElementById('btn-salva-mobile')?.addEventListener('click', () => salvaPreventivo('bozza'));
}

function aggiornaRiepilogo() {
    const body = document.getElementById('riepilogo-body');
    if (!body) return;

    const { preventivo } = getStato();
    const { posizioni, riepilogo } = calcolaRiepilogoCompleto();
    ultimoCalcolo = { posizioni, riepilogo };

    body.innerHTML = `
        <!-- Posizioni -->
        <div class="mb-3">
            <h6 class="text-muted small text-uppercase mb-2">Posizioni</h6>
            ${posizioni.length === 0
                ? '<p class="text-muted small">Nessuna posizione</p>'
                : posizioni.map(p => `
                    <div class="riepilogo-riga">
                        <span class="etichetta small">${p.descrizione.length > 35 ? p.descrizione.substring(0, 35) + '...' : p.descrizione}${p.quantita > 1 ? ` x${p.quantita}` : ''}${!p.scontabile ? ' *' : ''}</span>
                        <span class="valore small">${formattaEuro(p.prezzo_unitario * (p.quantita || 1))}</span>
                    </div>
                `).join('')
            }
        </div>

        <hr class="my-2">

        <!-- Sconto -->
        <div class="mb-3">
            <div class="row g-2 align-items-center">
                <div class="col-7">
                    <label for="riep-sconto" class="form-label small mb-0">Sconto (%)</label>
                </div>
                <div class="col-5">
                    <input type="text" class="form-control form-control-sm" id="riep-sconto"
                           value="${preventivo.riepilogo.sconto}" placeholder="Es. 50 o 50+10">
                </div>
            </div>
        </div>

        <!-- Regione trasporto -->
        <div class="mb-3">
            <label for="riep-regione" class="form-label small mb-1">Regione Trasporto</label>
            <select class="form-select form-select-sm" id="riep-regione">
                ${REGIONI.map(r => `<option value="${r.value}" ${r.value === preventivo.riepilogo.regione_trasporto ? 'selected' : ''}>${r.text}</option>`).join('')}
            </select>
        </div>

        <hr class="my-2">

        <!-- Totali -->
        <div class="riepilogo-riga">
            <span class="etichetta">Totale Materiali</span>
            <span class="valore">${formattaEuro(riepilogo.totale_materiali)}</span>
        </div>
        ${preventivo.riepilogo.sconto ? `
        <div class="riepilogo-riga text-danger">
            <span class="etichetta">Sconto ${preventivo.riepilogo.sconto}%</span>
            <span class="valore">-${formattaEuro(riepilogo.totale_materiali - riepilogo.netto_materiali)}</span>
        </div>
        ` : ''}
        <div class="riepilogo-riga">
            <span class="etichetta">Netto Materiali</span>
            <span class="valore">${formattaEuro(riepilogo.netto_materiali)}</span>
        </div>
        ${riepilogo.totale_non_scontabile > 0 ? `
        <div class="riepilogo-riga">
            <span class="etichetta">Non scontabile *</span>
            <span class="valore">${formattaEuro(riepilogo.totale_non_scontabile)}</span>
        </div>
        ` : ''}
        <div class="riepilogo-riga">
            <span class="etichetta">Imballo</span>
            <span class="valore">${formattaEuro(riepilogo.imballo)}</span>
        </div>
        <div class="riepilogo-riga">
            <span class="etichetta">Trasporto</span>
            <span class="valore">${formattaEuro(riepilogo.trasporto)}</span>
        </div>
        <div class="riepilogo-riga">
            <span class="etichetta fw-bold">Imponibile</span>
            <span class="valore fw-bold">${formattaEuro(riepilogo.imponibile)}</span>
        </div>
        <div class="riepilogo-riga">
            <span class="etichetta">IVA 22%</span>
            <span class="valore">${formattaEuro(riepilogo.iva)}</span>
        </div>
        <div class="riepilogo-riga totale">
            <span class="etichetta">TOTALE</span>
            <span class="valore">${formattaEuro(riepilogo.totale)}</span>
        </div>
    `;

    // Bind input sconto e regione
    document.getElementById('riep-sconto')?.addEventListener('change', (e) => {
        aggiornaStato('riepilogo', { sconto: e.target.value });
    });

    document.getElementById('riep-regione')?.addEventListener('change', (e) => {
        aggiornaStato('riepilogo', { regione_trasporto: e.target.value });
    });
}

function aggiornaTotaleMobile() {
    const el = document.getElementById('totale-mobile');
    if (!el) return;
    const { riepilogo } = calcolaRiepilogoCompleto();
    el.textContent = formattaEuro(riepilogo.totale);
}

async function salvaPreventivo(stato) {
    const feedback = document.getElementById('riepilogo-feedback');
    const { preventivo } = getStato();

    // Validazione
    const validazione = validaPreventivo(preventivo);
    if (!validazione.valido) {
        if (feedback) {
            feedback.innerHTML = `<div class="alert alert-danger py-2 small">${validazione.errori.join('<br>')}</div>`;
        }
        return;
    }

    // Calcola riepilogo corrente
    const { posizioni, riepilogo } = calcolaRiepilogoCompleto();

    // Disabilita bottoni
    const btnBozza = document.getElementById('btn-salva-bozza');
    const btnPrev = document.getElementById('btn-crea-preventivo');
    if (btnBozza) btnBozza.disabled = true;
    if (btnPrev) btnPrev.disabled = true;
    if (feedback) feedback.innerHTML = '<div class="text-center"><span class="spinner-border spinner-border-sm"></span> Salvataggio...</div>';

    try {
        const utente = getUtente();

        // Crea il preventivo
        const datiPreventivo = {
            rivenditore_id: utente.rivenditore_id || 1,
            agenzia: preventivo.intestazione.agenzia,
            responsabile: preventivo.intestazione.responsabile,
            pagamento: preventivo.intestazione.pagamento,
            destinazione: preventivo.intestazione.destinazione,
            sconto: preventivo.riepilogo.sconto,
            mezzo_trasporto: preventivo.intestazione.mezzo_trasporto,
            giorni_evasione: preventivo.intestazione.giorni_evasione,
            note: preventivo.intestazione.note,
            imballo: riepilogo.imballo,
            trasporto: riepilogo.trasporto
        };

        const risultato = await api.post('/preventivi', datiPreventivo);
        const prevId = risultato.preventivo.id;

        // Salva le posizioni
        for (const pos of posizioni) {
            await api.post(`/preventivi/${prevId}/posizioni`, {
                numero_posizione: pos.numero,
                tipo: pos.tipo,
                descrizione: pos.descrizione,
                quantita: pos.quantita || 1,
                prezzo_unitario: pos.prezzo_unitario,
                scontabile: pos.scontabile
            });
        }

        // Ricalcola totali sul server
        await api.put(`/preventivi/${prevId}`, { ricalcola: true });

        // Se stato "preventivo", cambia stato
        if (stato === 'preventivo') {
            await api.put(`/preventivi/${prevId}/stato`, { stato: 'preventivo' });
        }

        if (feedback) {
            feedback.innerHTML = `
                <div class="alert alert-success py-2 small">
                    <i class="bi bi-check-circle me-1"></i>
                    Preventivo #${risultato.preventivo.numero} ${stato === 'bozza' ? 'salvato come bozza' : 'creato'}!
                </div>
            `;
        }
    } catch (err) {
        if (feedback) {
            feedback.innerHTML = `<div class="alert alert-danger py-2 small">${err.message}</div>`;
        }
    } finally {
        if (btnBozza) btnBozza.disabled = false;
        if (btnPrev) btnPrev.disabled = false;
    }
}
