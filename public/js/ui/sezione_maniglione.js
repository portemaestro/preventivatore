// Sezione maniglione opzionale
import { getStato, aggiornaStato } from '../stato.js';
import { formattaEuro } from '../utils/formattazione.js';

export function renderSezioneManiglione(container) {
    const { preventivo, listino } = getStato();
    const man = preventivo.maniglione;
    const dati = listino.optional?.maniglioni;

    // Costruisci opzioni modelli Hoppe
    const modelliHoppe = dati?.hoppe?.modelli || {};
    const opzioniHoppe = Object.entries(modelliHoppe).map(([key, val]) => ({
        value: key,
        text: `${val.nome} (${key.replace(/_/g, ' ').toUpperCase()})`
    }));

    // Finiture disponibili per il modello selezionato
    const modelloSelezionato = modelliHoppe[man.modello];
    const finitureDisponibili = modelloSelezionato ? Object.keys(modelloSelezionato.finiture || {}) : ['cromo_satinato'];

    // Lunghezze disponibili per modello + finitura
    const lunghezzeDisponibili = modelloSelezionato?.finiture?.[man.finitura] || [];

    const div = document.createElement('div');
    div.className = 'row g-3';

    div.innerHTML = `
        <div class="col-12 mb-3">
            <div class="form-check form-switch">
                <input class="form-check-input" type="checkbox" id="man-presente" ${man.presente ? 'checked' : ''}>
                <label class="form-check-label fw-bold" for="man-presente">Aggiungi Maniglione</label>
            </div>
        </div>

        <div id="man-dettagli" class="${!man.presente ? 'd-none' : ''}">
            <div class="row g-3">
                <div class="col-md-6 mb-3">
                    <label for="man-marca" class="form-label">Marca</label>
                    <select class="form-select" id="man-marca">
                        <option value="hoppe" ${man.marca === 'hoppe' ? 'selected' : ''}>Hoppe</option>
                        <option value="aluform" ${man.marca === 'aluform' ? 'selected' : ''}>Aluform</option>
                    </select>
                </div>

                ${man.marca === 'hoppe' ? `
                <div class="col-md-6 mb-3">
                    <label for="man-modello" class="form-label">Modello</label>
                    <select class="form-select" id="man-modello">
                        ${opzioniHoppe.map(o => `<option value="${o.value}" ${o.value === man.modello ? 'selected' : ''}>${o.text}</option>`).join('')}
                    </select>
                </div>
                <div class="col-md-6 mb-3">
                    <label for="man-finitura" class="form-label">Finitura</label>
                    <select class="form-select" id="man-finitura">
                        ${finitureDisponibili.map(f => `<option value="${f}" ${f === man.finitura ? 'selected' : ''}>${f.replace(/_/g, ' ')}</option>`).join('')}
                    </select>
                </div>
                <div class="col-md-6 mb-3">
                    <label for="man-lunghezza" class="form-label">Lunghezza</label>
                    <select class="form-select" id="man-lunghezza">
                        ${lunghezzeDisponibili.map(l => {
                            const p = l.prezzo ? ` (${formattaEuro(l.prezzo)})` : ' (su richiesta)';
                            return `<option value="${l.lunghezza}" ${l.lunghezza === man.lunghezza ? 'selected' : ''}>${l.lunghezza}mm - int. ${l.interasse}mm${p}</option>`;
                        }).join('')}
                    </select>
                </div>
                ` : `
                <div class="col-md-6 mb-3">
                    <label for="man-modello-alu" class="form-label">Codice Modello</label>
                    <input type="text" class="form-control" id="man-modello-alu" value="${man.modello}" placeholder="Es. A 951, A 962...">
                </div>
                `}
            </div>
        </div>
    `;

    container.appendChild(div);

    // Bind
    document.getElementById('man-presente')?.addEventListener('change', (e) => {
        aggiornaStato('maniglione', { presente: e.target.checked });
        document.getElementById('man-dettagli')?.classList.toggle('d-none', !e.target.checked);
    });

    document.getElementById('man-marca')?.addEventListener('change', (e) => {
        const nuovoModello = e.target.value === 'hoppe' ? (opzioniHoppe[0]?.value || '') : '';
        aggiornaStato('maniglione', { marca: e.target.value, modello: nuovoModello, finitura: 'cromo_satinato' });
        container.innerHTML = '';
        renderSezioneManiglione(container);
    });

    document.getElementById('man-modello')?.addEventListener('change', (e) => {
        aggiornaStato('maniglione', { modello: e.target.value, finitura: 'cromo_satinato' });
        container.innerHTML = '';
        renderSezioneManiglione(container);
    });

    document.getElementById('man-finitura')?.addEventListener('change', (e) => {
        aggiornaStato('maniglione', { finitura: e.target.value });
        container.innerHTML = '';
        renderSezioneManiglione(container);
    });

    document.getElementById('man-lunghezza')?.addEventListener('change', (e) => {
        aggiornaStato('maniglione', { lunghezza: parseInt(e.target.value) });
    });

    document.getElementById('man-modello-alu')?.addEventListener('change', (e) => {
        aggiornaStato('maniglione', { modello: e.target.value });
    });
}
