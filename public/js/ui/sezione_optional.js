// Sezione optional: kit termico, acustico, sfinestrature, ecc.
import { getStato, aggiornaStato } from '../stato.js';
import { formattaEuro } from '../utils/formattazione.js';

export function renderSezioneOptional(container) {
    const { preventivo, listino } = getStato();
    const opt = preventivo.optional;
    const { blindato } = preventivo;
    const numAnte = blindato.configurazione_ante.startsWith('2') ? 2 : 1;

    // Kit termici dal listino
    const kitTermici = listino.supplementi?.kit_coibentazione_termica?.kit || [];
    const kitAcustici = listino.supplementi?.kit_acustico?.kit || [];

    const div = document.createElement('div');
    div.className = 'row g-3';

    div.innerHTML = `
        <!-- Kit Termico -->
        <div class="col-md-6 mb-3">
            <label for="opt-kit-termico" class="form-label">Kit Coibentazione Termica</label>
            <select class="form-select" id="opt-kit-termico">
                <option value="">Nessuno</option>
                ${kitTermici.map(k =>
                    `<option value="${k.codice}" ${k.codice === opt.kit_termico ? 'selected' : ''}>${k.codice} - ${k.descrizione} (${formattaEuro(k.prezzo)})</option>`
                ).join('')}
            </select>
        </div>

        <!-- Kit Acustico -->
        <div class="col-md-6 mb-3">
            <label for="opt-kit-acustico" class="form-label">Kit Acustico</label>
            <select class="form-select" id="opt-kit-acustico">
                <option value="">Nessuno</option>
                ${kitAcustici.map(k =>
                    `<option value="${k.codice}" ${k.codice === opt.kit_acustico ? 'selected' : ''}>${k.codice} - ${k.descrizione} ${k.abbattimento_db}dB (${formattaEuro(k.prezzo)})</option>`
                ).join('')}
            </select>
        </div>

        <!-- Sfinestrature -->
        <div class="col-md-6 mb-3">
            <label for="opt-sfinestrature" class="form-label">Sfinestrature Rettangolari + Vetro Blindato</label>
            <select class="form-select" id="opt-sfinestrature">
                <option value="0" ${opt.sfinestrature === 0 ? 'selected' : ''}>Nessuna</option>
                <option value="1" ${opt.sfinestrature === 1 ? 'selected' : ''}>1 Sfinestratura (${formattaEuro(1060)})</option>
                <option value="2" ${opt.sfinestrature === 2 ? 'selected' : ''}>2 Sfinestrature (${formattaEuro(1590)})</option>
                <option value="3" ${opt.sfinestrature === 3 ? 'selected' : ''}>3 Sfinestrature (${formattaEuro(2120)})</option>
                <option value="4" ${opt.sfinestrature === 4 ? 'selected' : ''}>4 Sfinestrature (${formattaEuro(2650)})</option>
            </select>
        </div>

        ${opt.sfinestrature > 0 ? `
        <div class="col-md-6 mb-3">
            <label for="opt-vetro" class="form-label">Tipo Vetro</label>
            <select class="form-select" id="opt-vetro">
                <option value="sabbiato" ${opt.vetro_sfinestratura === 'sabbiato' ? 'selected' : ''}>Sabbiato (84%)</option>
                <option value="trasparente" ${opt.vetro_sfinestratura === 'trasparente' ? 'selected' : ''}>Trasparente</option>
            </select>
        </div>
        ` : ''}

        <hr class="my-2">

        <!-- Checkbox optional -->
        <div class="col-md-6 mb-2">
            <div class="form-check">
                <input class="form-check-input" type="checkbox" id="opt-apertura-tirare" ${opt.apertura_tirare ? 'checked' : ''}>
                <label class="form-check-label" for="opt-apertura-tirare">Apertura a Tirare <span class="badge-prezzo supplemento">${formattaEuro(180)}</span></label>
            </div>
        </div>
        <div class="col-md-6 mb-2">
            <div class="form-check">
                <input class="form-check-input" type="checkbox" id="opt-doppia-maniglia" ${opt.doppia_maniglia_passante ? 'checked' : ''}>
                <label class="form-check-label" for="opt-doppia-maniglia">Doppia Maniglia Passante <span class="badge-prezzo supplemento">${formattaEuro(80)}</span></label>
            </div>
        </div>
        <div class="col-md-6 mb-2">
            <div class="form-check">
                <input class="form-check-input" type="checkbox" id="opt-incontro-elettrico" ${opt.incontro_elettrico ? 'checked' : ''}>
                <label class="form-check-label" for="opt-incontro-elettrico">Incontro Elettrico <span class="badge-prezzo supplemento">${formattaEuro(numAnte === 1 ? 170 : 225)}</span></label>
            </div>
        </div>
        <div class="col-md-6 mb-2">
            <div class="form-check">
                <input class="form-check-input" type="checkbox" id="opt-predisposto" ${opt.predisposto_senza_rivestimento ? 'checked' : ''}>
                <label class="form-check-label" for="opt-predisposto">Predisposto senza rivestimento <span class="badge-prezzo sconto">-${formattaEuro(100)}</span></label>
            </div>
        </div>
        <div class="col-md-6 mb-2">
            <div class="form-check">
                <input class="form-check-input" type="checkbox" id="opt-grata" ${opt.grata_sfinestratura ? 'checked' : ''}>
                <label class="form-check-label" for="opt-grata">Grata per Sfinestratura <span class="badge-prezzo supplemento">${formattaEuro(1150)}</span></label>
            </div>
        </div>
        <div class="col-md-6 mb-2">
            <div class="form-check">
                <input class="form-check-input" type="checkbox" id="opt-cappotto" ${opt.controtelaio_guida_cappotto ? 'checked' : ''}>
                <label class="form-check-label" for="opt-cappotto">Controtelaio Guida Cappotto <span class="badge-prezzo supplemento">${formattaEuro(110)}</span></label>
            </div>
        </div>

        ${blindato.tipo_cerniera === 'scomparsa' && blindato.modello === 'moving' ? `
        <div class="col-md-6 mb-2">
            <div class="form-check">
                <input class="form-check-input" type="checkbox" id="opt-rotox-c4" ${opt.supplemento_rotox_classe4 ? 'checked' : ''}>
                <label class="form-check-label" for="opt-rotox-c4">Supplemento Rotox Classe 4 <span class="badge-prezzo supplemento">${formattaEuro(730)}</span></label>
            </div>
        </div>
        ` : ''}
    `;

    container.appendChild(div);

    // Bind
    document.getElementById('opt-kit-termico')?.addEventListener('change', (e) => {
        aggiornaStato('optional', { kit_termico: e.target.value });
    });
    document.getElementById('opt-kit-acustico')?.addEventListener('change', (e) => {
        aggiornaStato('optional', { kit_acustico: e.target.value });
    });
    document.getElementById('opt-sfinestrature')?.addEventListener('change', (e) => {
        aggiornaStato('optional', { sfinestrature: parseInt(e.target.value) });
        container.innerHTML = '';
        renderSezioneOptional(container);
    });
    document.getElementById('opt-vetro')?.addEventListener('change', (e) => {
        aggiornaStato('optional', { vetro_sfinestratura: e.target.value });
    });

    const bindCheck = (id, campo) => {
        document.getElementById(id)?.addEventListener('change', (e) => {
            aggiornaStato('optional', { [campo]: e.target.checked });
        });
    };

    bindCheck('opt-apertura-tirare', 'apertura_tirare');
    bindCheck('opt-doppia-maniglia', 'doppia_maniglia_passante');
    bindCheck('opt-incontro-elettrico', 'incontro_elettrico');
    bindCheck('opt-predisposto', 'predisposto_senza_rivestimento');
    bindCheck('opt-grata', 'grata_sfinestratura');
    bindCheck('opt-cappotto', 'controtelaio_guida_cappotto');
    bindCheck('opt-rotox-c4', 'supplemento_rotox_classe4');
}
