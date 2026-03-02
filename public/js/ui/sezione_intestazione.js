// Sezione intestazione preventivo: dati cliente, agenzia, pagamento
import { getStato, aggiornaStato } from '../stato.js';
import { isAdmin, getUtente } from '../auth.js';
import { AGENZIE, PAGAMENTI, MEZZI_TRASPORTO, GIORNI_EVASIONE } from '../config.js';

export function renderSezioneIntestazione(container) {
    const { preventivo } = getStato();
    const { intestazione } = preventivo;
    const admin = isAdmin();

    const div = document.createElement('div');
    div.className = 'row g-3';

    div.innerHTML = `
        <div class="col-md-6 mb-3">
            <label for="int-agenzia" class="form-label">Agenzia</label>
            <select class="form-select" id="int-agenzia" ${!admin ? 'disabled' : ''}>
                ${AGENZIE.map(a => `<option value="${a}" ${a === intestazione.agenzia ? 'selected' : ''}>${a}</option>`).join('')}
            </select>
        </div>
        <div class="col-md-6 mb-3">
            <label for="int-responsabile" class="form-label">Responsabile</label>
            <input type="text" class="form-control" id="int-responsabile" value="${intestazione.responsabile}" ${!admin ? 'disabled' : ''}>
        </div>
        <div class="col-md-6 mb-3">
            <label for="int-pagamento" class="form-label">Pagamento</label>
            <select class="form-select" id="int-pagamento">
                ${PAGAMENTI.map(p => `<option value="${p}" ${p === intestazione.pagamento ? 'selected' : ''}>${p}</option>`).join('')}
            </select>
        </div>
        <div class="col-md-6 mb-3">
            <label for="int-destinazione" class="form-label">Destinazione</label>
            <input type="text" class="form-control" id="int-destinazione" value="${intestazione.destinazione}" placeholder="Indirizzo destinazione">
        </div>
        <div class="col-md-4 mb-3">
            <label for="int-mezzo" class="form-label">Mezzo Trasporto</label>
            <select class="form-select" id="int-mezzo">
                ${MEZZI_TRASPORTO.map(m => `<option value="${m}" ${m === intestazione.mezzo_trasporto ? 'selected' : ''}>${m}</option>`).join('')}
            </select>
        </div>
        <div class="col-md-4 mb-3">
            <label for="int-evasione" class="form-label">Evasione (gg lavorativi)</label>
            <select class="form-select" id="int-evasione">
                ${GIORNI_EVASIONE.map(g => `<option value="${g}" ${g === intestazione.giorni_evasione ? 'selected' : ''}>${g} giorni</option>`).join('')}
            </select>
        </div>
        <div class="col-md-4 mb-3">
            <label for="int-quantita" class="form-label">Quantità porte</label>
            <input type="number" class="form-control" id="int-quantita" value="${preventivo.blindato.quantita}" min="1" max="20">
        </div>
        <div class="col-12 mb-3">
            <label for="int-note" class="form-label">Note</label>
            <textarea class="form-control" id="int-note" rows="2" placeholder="Note aggiuntive...">${intestazione.note || ''}</textarea>
        </div>
    `;

    container.appendChild(div);

    // Event listeners
    const bind = (id, campo) => {
        const el = document.getElementById(id);
        if (!el) return;
        el.addEventListener('change', (e) => {
            aggiornaStato('intestazione', { [campo]: e.target.value });
        });
    };

    bind('int-agenzia', 'agenzia');
    bind('int-responsabile', 'responsabile');
    bind('int-pagamento', 'pagamento');
    bind('int-destinazione', 'destinazione');
    bind('int-mezzo', 'mezzo_trasporto');
    bind('int-note', 'note');

    document.getElementById('int-evasione')?.addEventListener('change', (e) => {
        aggiornaStato('intestazione', { giorni_evasione: parseInt(e.target.value) });
    });

    document.getElementById('int-quantita')?.addEventListener('change', (e) => {
        aggiornaStato('blindato', { quantita: parseInt(e.target.value) || 1 });
    });
}
