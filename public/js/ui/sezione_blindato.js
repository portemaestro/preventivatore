// Sezione blindato: modello, ante, misure, serratura, accessori
import { getStato, aggiornaStato } from '../stato.js';
import { isMisuraStandard } from '../utils/validazione.js';
import { formattaEuro } from '../utils/formattazione.js';

const CONFIGURAZIONI_ANTE = [
    { value: '1_anta_spingere_dx', text: '1 Anta Spingere Destra' },
    { value: '1_anta_spingere_sx', text: '1 Anta Spingere Sinistra' },
    { value: '2_ante_asimm_spingere_dx', text: '2 Ante Asimmetriche Spingere Destra' },
    { value: '2_ante_asimm_spingere_sx', text: '2 Ante Asimmetriche Spingere Sinistra' },
    { value: '2_ante_simm_spingere_dx', text: '2 Ante Simmetriche Spingere Destra' },
    { value: '2_ante_simm_spingere_sx', text: '2 Ante Simmetriche Spingere Sinistra' },
    { value: '1_anta_tirare_dx', text: '1 Anta Tirare Destra' },
    { value: '1_anta_tirare_sx', text: '1 Anta Tirare Sinistra' }
];

const SERRATURE = [
    { value: 'standard', text: 'Ingranaggi con Trappola Antieffrazione', prezzo: 0 },
    { value: 'motorizzata_attuatore', text: 'Motorizzata Attuatore X1R', prezzo: 1680 },
    { value: 'motorizzata_easy', text: 'Motorizzata Easy X1R', prezzo: 1970 },
    { value: 'motorizzata_smart', text: 'Motorizzata Smart X1R', prezzo: 2360 },
    { value: 'multiservizio', text: 'Serratura Multiservizio', prezzo: 340 },
    { value: 'sblocco_rapido', text: 'Sblocco Rapido', prezzo: 110 }
];

const CILINDRI = [
    { value: 'standard', text: 'EVO K75 Top Securemme (5 chiavi + 1 cantiere)', prezzo: 0 },
    { value: 'codolo_pomolino', text: 'Codolo con Pomolino Cromo', prezzo: 90 },
    { value: 'evva_mcs', text: 'EVVA MCS Rotori Magnetici', prezzo: 700 }
];

const DEFENDER = [
    { value: 'standard', text: 'Antishock Classe 4 - Cromo Satinato', prezzo: 0 },
    { value: 'quadra_cromo_sat', text: 'Serie Quadra Cromo Satinato', prezzo: 90 },
    { value: 'quadra_nero_sat', text: 'Serie Quadra Nero Satinato', prezzo: 110 },
    { value: 'quadra_cromo_luc', text: 'Serie Quadra Cromo Lucido', prezzo: 120 },
    { value: 'meccanico_rotante', text: 'Meccanico Magnetico Rotante', prezzo: 180 }
];

const MANIGLIE_INTERNE = [
    { value: 'standard', text: 'Alluminio Cromo Satinato', prezzo: 0 },
    { value: 'bronzo_sat', text: 'Alluminio Bronzo Satinato', prezzo: 0 },
    { value: 'ottone_luc', text: 'Ottone Lucido', prezzo: 0 },
    { value: 'quadra_cromo', text: 'Serie Quadra Cromo Satinato', prezzo: 90 },
    { value: 'quadra_nero', text: 'Serie Quadra Nero Satinato', prezzo: 140 },
    { value: 'esclusa', text: 'Esclusa', prezzo: 0 }
];

const POMOLI_ESTERNI = [
    { value: 'standard', text: 'Alluminio Cromo Satinato', prezzo: 0 },
    { value: 'bronzo_sat', text: 'Alluminio Bronzo Satinato', prezzo: 0 },
    { value: 'ottone_luc', text: 'Ottone Lucido', prezzo: 0 },
    { value: 'quadra_cromo', text: 'Serie Quadra Cromo Satinato', prezzo: 110 },
    { value: 'quadra_nero', text: 'Serie Quadra Nero Satinato', prezzo: 180 },
    { value: 'uovo_girevole', text: 'Pomolo a Uovo Girevole', prezzo: 90 },
    { value: 'escluso', text: 'Escluso', prezzo: 0 }
];

const LIMITATORI = [
    { value: 'standard', text: 'Cromo Satinato', prezzo: 0 },
    { value: 'quadra_cromo', text: 'Serie Quadra Cromo Satinato', prezzo: 60 },
    { value: 'quadra_nero', text: 'Serie Quadra Nero Satinato', prezzo: 90 },
    { value: 'escluso', text: 'Escluso', prezzo: 0 }
];

const SPIONCINI = [
    { value: 'compreso', text: 'Compreso (standard)', prezzo: 0 },
    { value: 'a_parte_no_foro', text: 'A Parte - No Foro', prezzo: 0 },
    { value: 'escluso', text: 'Escluso', prezzo: 0 },
    { value: 'digitale_wifi', text: 'Digitale WiFi', prezzo: 360 }
];

const SOGLIE = [
    { value: 'mobile_paraspifferi', text: 'Mobile Paraspifferi', prezzo: 0 },
    { value: 'fissa_alluminio', text: 'Fissa in Alluminio', prezzo: 0 },
    { value: 'battuta_pavimento', text: 'Battuta a Pavimento con Coibentazione', prezzo: 120 },
    { value: 'slim', text: 'Slim', prezzo: 0 }
];

export function renderSezioneBlindato(container) {
    const { preventivo, listino } = getStato();
    const { blindato } = preventivo;

    const div = document.createElement('div');
    div.id = 'sezione-blindato-content';

    renderContenutoBlindato(div);
    container.appendChild(div);
}

function renderContenutoBlindato(container) {
    const { preventivo, listino } = getStato();
    const { blindato } = preventivo;

    // Elenco modelli cerniere a vista
    const modelliVista = listino.blindati?.modelli_cerniere_vista || {};
    const modelliScomparsa = listino.optional?.cerniere_scomparsa?.modelli || [];

    // Determina prezzi base per mostrare nel select
    const opzioniModelliVista = Object.entries(modelliVista).map(([key, val]) => ({
        value: key,
        text: `${val.nome} (Classe ${val.classe})`,
        prezzo: val['1_anta']?.prezzo_base || val['1_sfinestratura_dritta']?.prezzo_totale || 0
    }));

    const opzioniModelliScomparsa = modelliScomparsa.map(m => ({
        value: m.modello.toLowerCase(),
        text: `${m.modello} (Classe ${m.classe})`,
        prezzo: m.anta_principale?.prezzo || 0
    }));

    const standard = isMisuraStandard(blindato.larghezza, blindato.altezza);

    container.innerHTML = `
        <div class="row g-3">
            <!-- Tipo cerniera -->
            <div class="col-md-6 mb-3">
                <label for="bl-tipo-cerniera" class="form-label">Tipo Cerniera</label>
                <select class="form-select" id="bl-tipo-cerniera">
                    <option value="vista" ${blindato.tipo_cerniera === 'vista' ? 'selected' : ''}>Cerniere a Vista</option>
                    <option value="scomparsa" ${blindato.tipo_cerniera === 'scomparsa' ? 'selected' : ''}>Cerniere a Scomparsa</option>
                </select>
            </div>

            <!-- Modello -->
            <div class="col-md-6 mb-3">
                <label for="bl-modello" class="form-label">Modello</label>
                <select class="form-select" id="bl-modello">
                    ${blindato.tipo_cerniera === 'vista'
                        ? opzioniModelliVista.map(o => `<option value="${o.value}" ${o.value === blindato.modello ? 'selected' : ''}>${o.text} - ${formattaEuro(o.prezzo)}</option>`).join('')
                        : opzioniModelliScomparsa.map(o => `<option value="${o.value}" ${o.value === blindato.modello ? 'selected' : ''}>${o.text} - ${formattaEuro(o.prezzo)}</option>`).join('')
                    }
                </select>
            </div>

            <!-- Configurazione ante -->
            <div class="col-md-6 mb-3">
                <label for="bl-ante" class="form-label">Configurazione Ante</label>
                <select class="form-select" id="bl-ante">
                    ${CONFIGURAZIONI_ANTE.map(o => `<option value="${o.value}" ${o.value === blindato.configurazione_ante ? 'selected' : ''}>${o.text}</option>`).join('')}
                </select>
            </div>

            <!-- Misure -->
            <div class="col-md-3 mb-3">
                <label for="bl-larghezza" class="form-label">Larghezza (mm)</label>
                <input type="number" class="form-control" id="bl-larghezza" value="${blindato.larghezza}" min="600" max="1200" step="10">
            </div>
            <div class="col-md-3 mb-3">
                <label for="bl-altezza" class="form-label">Altezza (mm)</label>
                <input type="number" class="form-control" id="bl-altezza" value="${blindato.altezza}" min="1800" max="2900" step="10">
            </div>

            <!-- Indicatore fuori standard -->
            <div class="col-12" id="bl-fuori-standard-info">
                ${!standard ? '<div class="alert alert-warning py-2 small"><i class="bi bi-exclamation-triangle me-1"></i>Misura fuori standard - supplemento applicato automaticamente</div>' : ''}
            </div>

            <hr class="my-2">

            <!-- Serratura -->
            <div class="col-md-6 mb-3">
                <label for="bl-serratura" class="form-label">Serratura</label>
                <select class="form-select" id="bl-serratura">
                    ${SERRATURE.map(o => {
                        const p = o.prezzo > 0 ? ` (+${formattaEuro(o.prezzo)})` : ' (inclusa)';
                        return `<option value="${o.value}" ${o.value === blindato.serratura ? 'selected' : ''}>${o.text}${p}</option>`;
                    }).join('')}
                </select>
            </div>

            <!-- Cilindro -->
            <div class="col-md-6 mb-3">
                <label for="bl-cilindro" class="form-label">Cilindro</label>
                <select class="form-select" id="bl-cilindro">
                    ${CILINDRI.map(o => {
                        const p = o.prezzo > 0 ? ` (+${formattaEuro(o.prezzo)})` : ' (incluso)';
                        return `<option value="${o.value}" ${o.value === blindato.cilindro ? 'selected' : ''}>${o.text}${p}</option>`;
                    }).join('')}
                </select>
            </div>

            <!-- Defender -->
            <div class="col-md-6 mb-3">
                <label for="bl-defender" class="form-label">Defender</label>
                <select class="form-select" id="bl-defender">
                    ${DEFENDER.map(o => {
                        const p = o.prezzo > 0 ? ` (+${formattaEuro(o.prezzo)})` : ' (incluso)';
                        return `<option value="${o.value}" ${o.value === blindato.defender ? 'selected' : ''}>${o.text}${p}</option>`;
                    }).join('')}
                </select>
            </div>

            <!-- Maniglia interna -->
            <div class="col-md-6 mb-3">
                <label for="bl-maniglia" class="form-label">Maniglia Interna</label>
                <select class="form-select" id="bl-maniglia">
                    ${MANIGLIE_INTERNE.map(o => {
                        const p = o.prezzo > 0 ? ` (+${formattaEuro(o.prezzo)})` : '';
                        return `<option value="${o.value}" ${o.value === blindato.maniglia_interna ? 'selected' : ''}>${o.text}${p}</option>`;
                    }).join('')}
                </select>
            </div>

            <!-- Pomolo esterno -->
            <div class="col-md-6 mb-3">
                <label for="bl-pomolo" class="form-label">Pomolo Esterno</label>
                <select class="form-select" id="bl-pomolo">
                    ${POMOLI_ESTERNI.map(o => {
                        const p = o.prezzo > 0 ? ` (+${formattaEuro(o.prezzo)})` : '';
                        return `<option value="${o.value}" ${o.value === blindato.pomolo_esterno ? 'selected' : ''}>${o.text}${p}</option>`;
                    }).join('')}
                </select>
            </div>

            <!-- Limitatore -->
            <div class="col-md-6 mb-3">
                <label for="bl-limitatore" class="form-label">Limitatore Apertura</label>
                <select class="form-select" id="bl-limitatore">
                    ${LIMITATORI.map(o => {
                        const p = o.prezzo > 0 ? ` (+${formattaEuro(o.prezzo)})` : '';
                        return `<option value="${o.value}" ${o.value === blindato.limitatore ? 'selected' : ''}>${o.text}${p}</option>`;
                    }).join('')}
                </select>
            </div>

            <!-- Spioncino -->
            <div class="col-md-6 mb-3">
                <label for="bl-spioncino" class="form-label">Spioncino</label>
                <select class="form-select" id="bl-spioncino">
                    ${SPIONCINI.map(o => {
                        const p = o.prezzo > 0 ? ` (+${formattaEuro(o.prezzo)})` : '';
                        return `<option value="${o.value}" ${o.value === blindato.spioncino ? 'selected' : ''}>${o.text}${p}</option>`;
                    }).join('')}
                </select>
            </div>

            <!-- Soglia -->
            <div class="col-md-6 mb-3">
                <label for="bl-soglia" class="form-label">Soglia</label>
                <select class="form-select" id="bl-soglia">
                    ${SOGLIE.map(o => {
                        const p = o.prezzo > 0 ? ` (+${formattaEuro(o.prezzo)})` : '';
                        return `<option value="${o.value}" ${o.value === blindato.soglia ? 'selected' : ''}>${o.text}${p}</option>`;
                    }).join('')}
                </select>
            </div>
        </div>
    `;

    // Bind eventi
    const bindSelect = (id, campo) => {
        document.getElementById(id)?.addEventListener('change', (e) => {
            aggiornaStato('blindato', { [campo]: e.target.value });
        });
    };

    const bindNumero = (id, campo) => {
        document.getElementById(id)?.addEventListener('change', (e) => {
            const val = parseInt(e.target.value) || 0;
            aggiornaStato('blindato', { [campo]: val });
            // Aggiorna indicatore fuori standard
            aggiornaIndicatoreFuoriStandard();
        });
    };

    // Tipo cerniera → ricarica modelli
    document.getElementById('bl-tipo-cerniera')?.addEventListener('change', (e) => {
        const tipo = e.target.value;
        const nuovoModello = tipo === 'vista' ? 'bplus' : 'moving';
        aggiornaStato('blindato', { tipo_cerniera: tipo, modello: nuovoModello });
        // Ricarica sezione
        const contenuto = document.getElementById('sezione-blindato-content');
        if (contenuto) {
            contenuto.innerHTML = '';
            renderContenutoBlindato(contenuto);
        }
    });

    bindSelect('bl-modello', 'modello');
    bindSelect('bl-ante', 'configurazione_ante');
    bindNumero('bl-larghezza', 'larghezza');
    bindNumero('bl-altezza', 'altezza');
    bindSelect('bl-serratura', 'serratura');
    bindSelect('bl-cilindro', 'cilindro');
    bindSelect('bl-defender', 'defender');
    bindSelect('bl-maniglia', 'maniglia_interna');
    bindSelect('bl-pomolo', 'pomolo_esterno');
    bindSelect('bl-limitatore', 'limitatore');
    bindSelect('bl-spioncino', 'spioncino');
    bindSelect('bl-soglia', 'soglia');
}

function aggiornaIndicatoreFuoriStandard() {
    const { preventivo } = getStato();
    const standard = isMisuraStandard(preventivo.blindato.larghezza, preventivo.blindato.altezza);
    const infoDiv = document.getElementById('bl-fuori-standard-info');
    if (infoDiv) {
        infoDiv.innerHTML = !standard
            ? '<div class="alert alert-warning py-2 small"><i class="bi bi-exclamation-triangle me-1"></i>Misura fuori standard - supplemento applicato automaticamente</div>'
            : '';
    }
}
