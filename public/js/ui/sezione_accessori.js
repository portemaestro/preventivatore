// Sezione accessori e servizi: posa, express, LED, garanzia
import { getStato, aggiornaStato } from '../stato.js';
import { formattaEuro } from '../utils/formattazione.js';

export function renderSezioneAccessori(container) {
    const { preventivo } = getStato();
    const acc = preventivo.accessori;

    const div = document.createElement('div');
    div.className = 'row g-3';

    div.innerHTML = `
        <!-- Posa in Opera -->
        <div class="col-md-6 mb-3">
            <div class="form-check form-switch mb-2">
                <input class="form-check-input" type="checkbox" id="acc-posa" ${acc.posa_in_opera ? 'checked' : ''}>
                <label class="form-check-label" for="acc-posa">Posa in Opera <span class="badge bg-secondary ms-1">non scontabile</span></label>
            </div>
            <div id="acc-posa-prezzo" class="${!acc.posa_in_opera ? 'd-none' : ''}">
                <div class="input-group input-group-sm">
                    <span class="input-group-text">Prezzo</span>
                    <input type="number" class="form-control" id="acc-prezzo-posa" value="${acc.prezzo_posa}" min="0" step="10">
                    <span class="input-group-text">&euro;</span>
                </div>
            </div>
        </div>

        <!-- Produzione Express -->
        <div class="col-md-6 mb-3">
            <label for="acc-express" class="form-label">Produzione Express <span class="badge bg-secondary ms-1">non scontabile</span></label>
            <select class="form-select" id="acc-express">
                <option value="" ${!acc.produzione_express ? 'selected' : ''}>Standard (${preventivo.intestazione.giorni_evasione}gg)</option>
                <option value="platinum" ${acc.produzione_express === 'platinum' ? 'selected' : ''}>Platinum 5gg (${formattaEuro(250)})</option>
                <option value="gold" ${acc.produzione_express === 'gold' ? 'selected' : ''}>Gold 10gg (${formattaEuro(140)})</option>
                <option value="silver" ${acc.produzione_express === 'silver' ? 'selected' : ''}>Silver 15gg (${formattaEuro(100)})</option>
            </select>
        </div>

        <!-- Kit LED -->
        <div class="col-md-6 mb-3">
            <div class="form-check form-switch mb-2">
                <input class="form-check-input" type="checkbox" id="acc-led" ${acc.kit_led ? 'checked' : ''}>
                <label class="form-check-label" for="acc-led">Kit Illuminazione LED</label>
            </div>
            <div id="acc-led-altezza" class="${!acc.kit_led ? 'd-none' : ''}">
                <select class="form-select form-select-sm" id="acc-altezza-led">
                    <option value="400" ${acc.altezza_led === 400 ? 'selected' : ''}>h.400mm (${formattaEuro(250)})</option>
                    <option value="700" ${acc.altezza_led === 700 ? 'selected' : ''}>h.700mm (${formattaEuro(270)})</option>
                    <option value="1000" ${acc.altezza_led === 1000 ? 'selected' : ''}>h.1000mm (${formattaEuro(290)})</option>
                    <option value="1700" ${acc.altezza_led === 1700 ? 'selected' : ''}>h.1700mm (${formattaEuro(380)})</option>
                </select>
            </div>
        </div>

        <!-- Fermapannello -->
        <div class="col-md-6 mb-3">
            <div class="form-check form-switch">
                <input class="form-check-input" type="checkbox" id="acc-fermapannello" ${acc.fermapannello ? 'checked' : ''}>
                <label class="form-check-label" for="acc-fermapannello">Fermapannello Interno in Legno <span class="badge-prezzo supplemento">${formattaEuro(150)}</span></label>
            </div>
        </div>

        <hr class="my-2">

        <!-- Garanzia All Risk -->
        <div class="col-12 mb-3">
            <div class="form-check form-switch">
                <input class="form-check-input" type="checkbox" id="acc-garanzia" ${acc.garanzia_all_risk ? 'checked' : ''}>
                <label class="form-check-label" for="acc-garanzia">
                    Garanzia All Risk <span class="badge bg-secondary ms-1">non scontabile</span>
                    <small class="text-muted d-block">1 anta standard: ${formattaEuro(18)} | Fuori standard/2 ante: ${formattaEuro(38)}</small>
                </label>
            </div>
        </div>
    `;

    container.appendChild(div);

    // Bind
    document.getElementById('acc-posa')?.addEventListener('change', (e) => {
        aggiornaStato('accessori', { posa_in_opera: e.target.checked });
        document.getElementById('acc-posa-prezzo')?.classList.toggle('d-none', !e.target.checked);
    });

    document.getElementById('acc-prezzo-posa')?.addEventListener('change', (e) => {
        aggiornaStato('accessori', { prezzo_posa: parseFloat(e.target.value) || 0 });
    });

    document.getElementById('acc-express')?.addEventListener('change', (e) => {
        aggiornaStato('accessori', { produzione_express: e.target.value });
    });

    document.getElementById('acc-led')?.addEventListener('change', (e) => {
        aggiornaStato('accessori', { kit_led: e.target.checked });
        document.getElementById('acc-led-altezza')?.classList.toggle('d-none', !e.target.checked);
    });

    document.getElementById('acc-altezza-led')?.addEventListener('change', (e) => {
        aggiornaStato('accessori', { altezza_led: parseInt(e.target.value) });
    });

    document.getElementById('acc-fermapannello')?.addEventListener('change', (e) => {
        aggiornaStato('accessori', { fermapannello: e.target.checked });
    });

    document.getElementById('acc-garanzia')?.addEventListener('change', (e) => {
        aggiornaStato('accessori', { garanzia_all_risk: e.target.checked });
    });
}
