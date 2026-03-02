// Sezione rivestimento lato interno
import { getStato, aggiornaStato } from '../stato.js';
import { formattaEuro } from '../utils/formattazione.js';

export function renderSezioneRivestimentoInt(container) {
    const { preventivo, listino } = getStato();
    const riv = preventivo.rivestimento_interno;
    const datiLam = listino.rivestimenti?.laminati;

    // Costruisci opzioni colori in base al tipo e finitura
    const coloriStandard = datiLam?.finitura_standard?.colori || [];
    const coloriMatrix = datiLam?.finitura_optional_matrix?.colori || [];
    const coloriLongLife = datiLam?.finitura_optional_long_life?.colori || [];

    let coloriAttivi = coloriStandard;
    if (riv.finitura === 'matrix') coloriAttivi = coloriMatrix;
    if (riv.finitura === 'long_life') coloriAttivi = coloriLongLife;

    const div = document.createElement('div');
    div.className = 'row g-3';
    div.id = 'riv-int-content';

    div.innerHTML = `
        <div class="col-md-4 mb-3">
            <label for="rivint-tipo" class="form-label">Tipo Rivestimento</label>
            <select class="form-select" id="rivint-tipo">
                <option value="laminato" ${riv.tipo === 'laminato' ? 'selected' : ''}>Laminato 6mm (standard)</option>
                <option value="mdf" ${riv.tipo === 'mdf' ? 'selected' : ''}>MDF 7/12mm</option>
                <option value="okoume" ${riv.tipo === 'okoume' ? 'selected' : ''}>Okoum&egrave; 14mm</option>
                <option value="impiallacciato" ${riv.tipo === 'impiallacciato' ? 'selected' : ''}>Impiallacciato 7mm</option>
            </select>
        </div>

        ${riv.tipo === 'laminato' ? `
        <div class="col-md-4 mb-3">
            <label for="rivint-finitura" class="form-label">Finitura</label>
            <select class="form-select" id="rivint-finitura">
                <option value="standard" ${riv.finitura === 'standard' ? 'selected' : ''}>Lisci Lam (inclusa)</option>
                <option value="matrix" ${riv.finitura === 'matrix' ? 'selected' : ''}>Matrix (+${formattaEuro(datiLam?.finitura_optional_matrix?.supplemento_misura_standard || 60)})</option>
                <option value="long_life" ${riv.finitura === 'long_life' ? 'selected' : ''}>Long Life (+${formattaEuro(datiLam?.finitura_optional_long_life?.supplemento_misura_standard || 120)})</option>
            </select>
        </div>
        ` : `
        <div class="col-md-4 mb-3">
            <label class="form-label">Info</label>
            <div class="form-control-plaintext small text-muted">
                ${riv.tipo === 'okoume' ? 'Pantografato - vari modelli' : ''}
                ${riv.tipo === 'mdf' ? 'Liscio o pantografato' : ''}
                ${riv.tipo === 'impiallacciato' ? 'Tanganica, Frassino, Ciliegio' : ''}
            </div>
        </div>
        `}

        <div class="col-md-4 mb-3" id="rivint-colore-wrap">
            <label for="rivint-colore" class="form-label">Colore</label>
            <select class="form-select" id="rivint-colore">
                ${riv.tipo === 'laminato' ? coloriAttivi.map(c =>
                    `<option value="${c.codice}" ${c.codice === riv.colore ? 'selected' : ''}>${c.codice} - ${c.nome}</option>`
                ).join('') : `
                    <option value="">Da specificare</option>
                `}
            </select>
        </div>

        <div class="col-md-12 mb-3">
            <div class="form-check">
                <input class="form-check-input" type="checkbox" id="rivint-predisposto" ${riv.predisposto ? 'checked' : ''}>
                <label class="form-check-label" for="rivint-predisposto">
                    Predisposto senza rivestimento <span class="badge-prezzo sconto">-${formattaEuro(100)}</span>
                </label>
            </div>
        </div>
    `;

    container.appendChild(div);

    // Bind
    document.getElementById('rivint-tipo')?.addEventListener('change', (e) => {
        aggiornaStato('rivestimento_interno', { tipo: e.target.value, finitura: 'standard', colore: '' });
        container.innerHTML = '';
        renderSezioneRivestimentoInt(container);
    });

    document.getElementById('rivint-finitura')?.addEventListener('change', (e) => {
        aggiornaStato('rivestimento_interno', { finitura: e.target.value, colore: '' });
        container.innerHTML = '';
        renderSezioneRivestimentoInt(container);
    });

    document.getElementById('rivint-colore')?.addEventListener('change', (e) => {
        aggiornaStato('rivestimento_interno', { colore: e.target.value });
    });

    document.getElementById('rivint-predisposto')?.addEventListener('change', (e) => {
        aggiornaStato('rivestimento_interno', { predisposto: e.target.checked });
    });
}
