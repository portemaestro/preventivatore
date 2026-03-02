// Sezione rivestimento lato esterno
import { getStato, aggiornaStato } from '../stato.js';
import { formattaEuro } from '../utils/formattazione.js';

export function renderSezioneRivestimentoEst(container) {
    const { preventivo, listino } = getStato();
    const riv = preventivo.rivestimento_esterno;
    const datiLam = listino.rivestimenti?.laminati;

    // Colori in base alla finitura
    let colori = [];
    if (riv.tipo === 'laminato') {
        if (riv.finitura === 'matrix') colori = datiLam?.finitura_optional_matrix?.colori || [];
        else if (riv.finitura === 'long_life') colori = datiLam?.finitura_optional_long_life?.colori || [];
        else colori = datiLam?.finitura_standard?.colori || [];
    }

    const div = document.createElement('div');
    div.className = 'row g-3';

    div.innerHTML = `
        <div class="col-md-4 mb-3">
            <label for="rivest-tipo" class="form-label">Tipo Rivestimento</label>
            <select class="form-select" id="rivest-tipo">
                <option value="laminato" ${riv.tipo === 'laminato' ? 'selected' : ''}>Laminato 6mm (standard)</option>
                <option value="okoume" ${riv.tipo === 'okoume' ? 'selected' : ''}>Okoum&egrave; 14mm (+${formattaEuro(580)})</option>
                <option value="alluminio" ${riv.tipo === 'alluminio' ? 'selected' : ''}>Alluminio Aluform (+${formattaEuro(830)})</option>
                <option value="pvc" ${riv.tipo === 'pvc' ? 'selected' : ''}>PVC (+${formattaEuro(650)})</option>
                <option value="bachelite" ${riv.tipo === 'bachelite' ? 'selected' : ''}>Bachelite/Stratificato (+${formattaEuro(350)})</option>
                <option value="mdf" ${riv.tipo === 'mdf' ? 'selected' : ''}>MDF Laccato (+${formattaEuro(400)})</option>
            </select>
        </div>

        ${riv.tipo === 'laminato' ? `
        <div class="col-md-4 mb-3">
            <label for="rivest-finitura" class="form-label">Finitura</label>
            <select class="form-select" id="rivest-finitura">
                <option value="standard" ${riv.finitura === 'standard' ? 'selected' : ''}>Lisci Lam (inclusa)</option>
                <option value="matrix" ${riv.finitura === 'matrix' ? 'selected' : ''}>Matrix (+${formattaEuro(60)})</option>
                <option value="long_life" ${riv.finitura === 'long_life' ? 'selected' : ''}>Long Life (+${formattaEuro(120)})</option>
            </select>
        </div>
        <div class="col-md-4 mb-3">
            <label for="rivest-colore" class="form-label">Colore</label>
            <select class="form-select" id="rivest-colore">
                ${colori.map(c => `<option value="${c.codice}" ${c.codice === riv.colore ? 'selected' : ''}>${c.codice} - ${c.nome}</option>`).join('')}
            </select>
        </div>
        ` : ''}

        ${riv.tipo === 'okoume' ? `
        <div class="col-md-4 mb-3">
            <label for="rivest-ambiente" class="form-label">Ambiente</label>
            <select class="form-select" id="rivest-ambiente">
                <option value="condominio" ${riv.ambiente === 'condominio' ? 'selected' : ''}>Condominio</option>
                <option value="esposto" ${riv.ambiente === 'esposto' ? 'selected' : ''}>Esposto alle intemperie</option>
            </select>
        </div>
        <div class="col-md-4 mb-3">
            <label for="rivest-modello" class="form-label">Modello</label>
            <input type="text" class="form-control" id="rivest-modello" value="${riv.modello}" placeholder="Es. Ursa, Cassiopea...">
        </div>
        ` : ''}

        ${riv.tipo === 'alluminio' ? `
        <div class="col-md-4 mb-3">
            <label for="rivest-modello" class="form-label">Modello Aluform</label>
            <input type="text" class="form-control" id="rivest-modello" value="${riv.modello}" placeholder="Es. Sahara, Atacama, Gibson...">
        </div>
        <div class="col-md-4 mb-3">
            <label for="rivest-colore-alu" class="form-label">Colore RAL / Finitura</label>
            <input type="text" class="form-control" id="rivest-colore-alu" value="${riv.colore}" placeholder="Es. RAL 7016 grinz">
        </div>
        ` : ''}

        ${riv.tipo === 'pvc' ? `
        <div class="col-md-4 mb-3">
            <label for="rivest-colore-pvc" class="form-label">Colore PVC</label>
            <select class="form-select" id="rivest-colore-pvc">
                <option value="marrone_testa_moro" ${riv.colore === 'marrone_testa_moro' ? 'selected' : ''}>Marrone Testa di Moro</option>
                <option value="bianco" ${riv.colore === 'bianco' ? 'selected' : ''}>Bianco</option>
                <option value="altro" ${riv.colore === 'altro' ? 'selected' : ''}>Altro</option>
            </select>
        </div>
        <div class="col-md-4 mb-3">
            <label for="rivest-modello-pvc" class="form-label">Modello</label>
            <input type="text" class="form-control" id="rivest-modello-pvc" value="${riv.modello}" placeholder="Liscio o pantografato">
        </div>
        ` : ''}

        ${(riv.tipo === 'bachelite' || riv.tipo === 'mdf') ? `
        <div class="col-md-4 mb-3">
            <label for="rivest-colore-gen" class="form-label">Colore</label>
            <input type="text" class="form-control" id="rivest-colore-gen" value="${riv.colore}" placeholder="Es. RAL o colore specifico">
        </div>
        ` : ''}
    `;

    container.appendChild(div);

    // Bind tipo → ricarica
    document.getElementById('rivest-tipo')?.addEventListener('change', (e) => {
        aggiornaStato('rivestimento_esterno', { tipo: e.target.value, finitura: 'standard', colore: '', modello: '' });
        container.innerHTML = '';
        renderSezioneRivestimentoEst(container);
    });

    document.getElementById('rivest-finitura')?.addEventListener('change', (e) => {
        aggiornaStato('rivestimento_esterno', { finitura: e.target.value, colore: '' });
        container.innerHTML = '';
        renderSezioneRivestimentoEst(container);
    });

    // Bind campi specifici
    const bindInput = (id, campo) => {
        document.getElementById(id)?.addEventListener('change', (e) => {
            aggiornaStato('rivestimento_esterno', { [campo]: e.target.value });
        });
    };

    bindInput('rivest-colore', 'colore');
    bindInput('rivest-ambiente', 'ambiente');
    bindInput('rivest-modello', 'modello');
    bindInput('rivest-colore-alu', 'colore');
    bindInput('rivest-colore-pvc', 'colore');
    bindInput('rivest-modello-pvc', 'modello');
    bindInput('rivest-colore-gen', 'colore');
}
