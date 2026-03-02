// Sezione coprifilo / imbotte
import { getStato, aggiornaStato } from '../stato.js';
import { formattaEuro } from '../utils/formattazione.js';

export function renderSezioneCoprifilo(container) {
    const { preventivo, listino } = getStato();
    const cop = preventivo.coprifilo;
    const datiLam = listino.rivestimenti?.laminati;

    const div = document.createElement('div');
    div.className = 'row g-3';

    div.innerHTML = `
        <div class="col-md-6 mb-3">
            <label for="cop-tipo" class="form-label">Tipo</label>
            <select class="form-select" id="cop-tipo">
                <option value="nessuno" ${cop.tipo === 'nessuno' ? 'selected' : ''}>Nessuno</option>
                <option value="laminato" ${cop.tipo === 'laminato' ? 'selected' : ''}>Coprifilo Laminato (+${formattaEuro(130)})</option>
                <option value="metallico_piatto" ${cop.tipo === 'metallico_piatto' ? 'selected' : ''}>Coprifilo Metallico Piatto 3 lati (+${formattaEuro(60)})</option>
                <option value="imbotte_laminato" ${cop.tipo === 'imbotte_laminato' ? 'selected' : ''}>Kit Imbotte Laminato + Coprifili (+${formattaEuro(405)})</option>
                <option value="imbotte_impiallacciato" ${cop.tipo === 'imbotte_impiallacciato' ? 'selected' : ''}>Kit Imbotte Impiallacciato + Coprifili (+${formattaEuro(480)})</option>
                <option value="okoume" ${cop.tipo === 'okoume' ? 'selected' : ''}>Coprifilo Okoum&egrave; (+${formattaEuro(280)})</option>
            </select>
        </div>

        ${cop.tipo === 'laminato' ? `
        <div class="col-md-6 mb-3">
            <label for="cop-larghezza" class="form-label">Larghezza Coprifilo</label>
            <select class="form-select" id="cop-larghezza">
                ${(datiLam?.coprifili_laminati?.larghezze || []).map(l =>
                    `<option value="${l.larghezza}" ${l.larghezza === cop.larghezza ? 'selected' : ''}>${l.larghezza} (${formattaEuro(l.prezzo)})</option>`
                ).join('')}
            </select>
        </div>
        ` : ''}

        ${cop.tipo === 'imbotte_laminato' ? `
        <div class="col-md-6 mb-3">
            <label for="cop-profondita" class="form-label">Profondit&agrave; Muro</label>
            <select class="form-select" id="cop-profondita">
                <option value="fino_15cm" ${cop.profondita_muro === 'fino_15cm' ? 'selected' : ''}>Fino a 15cm (${formattaEuro(405)})</option>
                <option value="da_15_1_a_25cm" ${cop.profondita_muro === 'da_15_1_a_25cm' ? 'selected' : ''}>Da 15,1 a 25cm (${formattaEuro(480)})</option>
                <option value="da_25_1_a_40cm" ${cop.profondita_muro === 'da_25_1_a_40cm' ? 'selected' : ''}>Da 25,1 a 40cm (${formattaEuro(580)})</option>
            </select>
        </div>
        ` : ''}
    `;

    container.appendChild(div);

    document.getElementById('cop-tipo')?.addEventListener('change', (e) => {
        aggiornaStato('coprifilo', { tipo: e.target.value, larghezza: '8cm_standard', profondita_muro: 'fino_15cm' });
        container.innerHTML = '';
        renderSezioneCoprifilo(container);
    });

    document.getElementById('cop-larghezza')?.addEventListener('change', (e) => {
        aggiornaStato('coprifilo', { larghezza: e.target.value });
    });

    document.getElementById('cop-profondita')?.addEventListener('change', (e) => {
        aggiornaStato('coprifilo', { profondita_muro: e.target.value });
    });
}
