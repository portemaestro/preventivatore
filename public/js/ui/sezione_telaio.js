// Sezione telaio: tipo, verniciatura
import { getStato, aggiornaStato } from '../stato.js';
import { formattaEuro } from '../utils/formattazione.js';

const TIPI_TELAIO = [
    { value: '65c', text: 'Telaio 65C (standard)' },
    { value: 'ridotto_l', text: 'Telaio Ridotto L' },
    { value: 'ridotto_z', text: 'Telaio Ridotto Z' },
    { value: 'ad_adattare', text: 'Telaio ad Adattare' },
    { value: 'complanare', text: 'Telaio Complanare' },
    { value: 'plana', text: 'Telaio Plana' }
];

const COLORI_TELAIO = [
    { value: 'marrone', text: 'Marrone (standard)' },
    { value: 'bianco', text: 'Bianco Simil RAL 9010' },
    { value: 'ral', text: 'RAL a Campione' }
];

export function renderSezioneTelaio(container) {
    const { preventivo, listino } = getStato();
    const { telaio, blindato } = preventivo;

    // Calcola supplementi per mostrare prezzi
    const dati = listino.telai;
    const numAnte = blindato.configurazione_ante.startsWith('2') ? 2 : 1;
    const chiaveAnte = numAnte === 1 ? '1_anta' : '2_ante';

    const prezzoRidotto = () => {
        if (!dati) return 320;
        const larg = blindato.larghezza <= 1050 ? 'fino_a_105' : 'oltre_105';
        const riga = dati.telai_ridotti_ristrutturazione?.tabella?.find(r => r.larghezza === larg);
        return riga?.altezza_fino_240 || 320;
    };

    const div = document.createElement('div');
    div.className = 'row g-3';
    div.innerHTML = `
        <div class="col-md-6 mb-3">
            <label for="tel-tipo" class="form-label">Tipo Telaio</label>
            <select class="form-select" id="tel-tipo">
                ${TIPI_TELAIO.map(o => {
                    let p = '';
                    if (o.value === 'ridotto_l' || o.value === 'ridotto_z') p = ` (+${formattaEuro(prezzoRidotto())})`;
                    if (o.value === 'ad_adattare') p = ` (+${formattaEuro(dati?.telaio_ad_adattare?.prezzi?.['1_pezzo'] || 540)})`;
                    return `<option value="${o.value}" ${o.value === telaio.tipo ? 'selected' : ''}>${o.text}${p}</option>`;
                }).join('')}
            </select>
        </div>
        <div class="col-md-3 mb-3">
            <label for="tel-colore-int" class="form-label">Colore Interno</label>
            <select class="form-select" id="tel-colore-int">
                ${COLORI_TELAIO.map(o => `<option value="${o.value}" ${o.value === telaio.colore_interno ? 'selected' : ''}>${o.text}</option>`).join('')}
            </select>
        </div>
        <div class="col-md-3 mb-3">
            <label for="tel-colore-est" class="form-label">Colore Esterno</label>
            <select class="form-select" id="tel-colore-est">
                ${COLORI_TELAIO.map(o => `<option value="${o.value}" ${o.value === telaio.colore_esterno ? 'selected' : ''}>${o.text}</option>`).join('')}
            </select>
        </div>
        <div class="col-md-6 mb-3 ${telaio.colore_interno !== 'ral' ? 'd-none' : ''}" id="tel-ral-int-wrap">
            <label for="tel-ral-int" class="form-label">Codice RAL Interno</label>
            <input type="text" class="form-control" id="tel-ral-int" value="${telaio.ral_interno}" placeholder="Es. RAL 7016">
        </div>
        <div class="col-md-6 mb-3 ${telaio.colore_esterno !== 'ral' ? 'd-none' : ''}" id="tel-ral-est-wrap">
            <label for="tel-ral-est" class="form-label">Codice RAL Esterno</label>
            <input type="text" class="form-control" id="tel-ral-est" value="${telaio.ral_esterno}" placeholder="Es. RAL 7016">
        </div>

        <!-- Info supplemento verniciatura -->
        <div class="col-12" id="tel-info-verniciatura"></div>
    `;

    container.appendChild(div);
    aggiornaInfoVerniciatura();

    // Bind
    document.getElementById('tel-tipo')?.addEventListener('change', (e) => {
        aggiornaStato('telaio', { tipo: e.target.value });
    });

    document.getElementById('tel-colore-int')?.addEventListener('change', (e) => {
        aggiornaStato('telaio', { colore_interno: e.target.value });
        document.getElementById('tel-ral-int-wrap')?.classList.toggle('d-none', e.target.value !== 'ral');
        aggiornaInfoVerniciatura();
    });

    document.getElementById('tel-colore-est')?.addEventListener('change', (e) => {
        aggiornaStato('telaio', { colore_esterno: e.target.value });
        document.getElementById('tel-ral-est-wrap')?.classList.toggle('d-none', e.target.value !== 'ral');
        aggiornaInfoVerniciatura();
    });

    document.getElementById('tel-ral-int')?.addEventListener('change', (e) => {
        aggiornaStato('telaio', { ral_interno: e.target.value });
    });

    document.getElementById('tel-ral-est')?.addEventListener('change', (e) => {
        aggiornaStato('telaio', { ral_esterno: e.target.value });
    });
}

function aggiornaInfoVerniciatura() {
    const { preventivo, listino } = getStato();
    const { telaio, blindato } = preventivo;
    const dati = listino.telai;
    const infoDiv = document.getElementById('tel-info-verniciatura');
    if (!infoDiv || !dati) return;

    const numAnte = blindato.configurazione_ante.startsWith('2') ? 2 : 1;
    const chiaveAnte = numAnte === 1 ? '1_anta' : '2_ante';
    const int = telaio.colore_interno;
    const est = telaio.colore_esterno;

    let supplemento = 0;
    let descrizione = '';

    if (int === 'marrone' && est === 'marrone') {
        descrizione = 'Verniciatura standard (inclusa)';
    } else if (int === est) {
        // Monocolore
        if (int === 'bianco') {
            supplemento = dati.verniciatura_monocolore?.colori?.bianco_simil_9010?.[chiaveAnte] || 0;
            descrizione = `Verniciatura monocolore Bianco: +${formattaEuro(supplemento)}`;
        } else if (int === 'ral') {
            supplemento = dati.verniciatura_monocolore?.colori?.tutti_i_ral?.[chiaveAnte] || 0;
            descrizione = `Verniciatura monocolore RAL: +${formattaEuro(supplemento)}`;
        }
    } else {
        // Bicolore
        const chiaveCombo = `int_${int}_est_${est}`;
        const combo = dati.verniciatura_bicolore?.combinazioni?.[chiaveCombo];
        supplemento = combo?.[chiaveAnte] || 0;
        descrizione = `Verniciatura bicolore (int: ${int}, est: ${est}): +${formattaEuro(supplemento)}`;
    }

    if (supplemento > 0) {
        infoDiv.innerHTML = `<div class="alert alert-info py-2 small"><i class="bi bi-palette me-1"></i>${descrizione}</div>`;
    } else {
        infoDiv.innerHTML = '';
    }
}
