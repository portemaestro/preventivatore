// Orchestratore del configuratore: accordion con tutte le sezioni
import { renderSezioneIntestazione } from './sezione_intestazione.js';
import { renderSezioneBlindato } from './sezione_blindato.js';
import { renderSezioneTelaio } from './sezione_telaio.js';
import { renderSezioneRivestimentoInt } from './sezione_rivestimento_int.js';
import { renderSezioneRivestimentoEst } from './sezione_rivestimento_est.js';
import { renderSezioneCoprifilo } from './sezione_coprifilo.js';
import { renderSezioneOptional } from './sezione_optional.js';
import { renderSezioneManiglione } from './sezione_maniglione.js';
import { renderSezioneAccessori } from './sezione_accessori.js';
import { renderRiepilogo, renderRiepilogoMobile } from './riepilogo.js';

const sezioni = [
    { id: 'intestazione', titolo: 'Dati Preventivo', icona: 'bi-file-text', render: renderSezioneIntestazione, aperta: true },
    { id: 'blindato', titolo: 'Blindato', icona: 'bi-door-closed', render: renderSezioneBlindato, aperta: true },
    { id: 'telaio', titolo: 'Telaio', icona: 'bi-bounding-box', render: renderSezioneTelaio },
    { id: 'riv-interno', titolo: 'Rivestimento Interno', icona: 'bi-palette', render: renderSezioneRivestimentoInt },
    { id: 'riv-esterno', titolo: 'Rivestimento Esterno', icona: 'bi-palette2', render: renderSezioneRivestimentoEst },
    { id: 'coprifilo', titolo: 'Coprifilo / Imbotte', icona: 'bi-border-outer', render: renderSezioneCoprifilo },
    { id: 'optional', titolo: 'Optional', icona: 'bi-plus-circle', render: renderSezioneOptional },
    { id: 'maniglione', titolo: 'Maniglione', icona: 'bi-grip-vertical', render: renderSezioneManiglione },
    { id: 'accessori', titolo: 'Accessori e Servizi', icona: 'bi-gear', render: renderSezioneAccessori }
];

export function renderConfiguratore(container) {
    container.innerHTML = `
        <div class="row mt-3 g-3">
            <!-- Colonna form -->
            <div class="col-lg-8">
                <div class="configuratore-form pe-lg-2">
                    <h4 class="mb-3 text-brand fw-bold">
                        <i class="bi bi-plus-circle me-2"></i>Nuovo Preventivo
                    </h4>
                    <div class="accordion" id="accordion-configuratore">
                        ${sezioni.map((sez, i) => `
                            <div class="accordion-item">
                                <h2 class="accordion-header">
                                    <button class="accordion-button ${sez.aperta ? '' : 'collapsed'}" type="button"
                                            data-bs-toggle="collapse" data-bs-target="#collapse-${sez.id}">
                                        <i class="${sez.icona} me-2"></i>${sez.titolo}
                                    </button>
                                </h2>
                                <div id="collapse-${sez.id}" class="accordion-collapse collapse ${sez.aperta ? 'show' : ''}"
                                     data-bs-parent="#accordion-configuratore">
                                    <div class="accordion-body" id="body-${sez.id}">
                                    </div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
            <!-- Colonna riepilogo -->
            <div class="col-lg-4">
                <div class="riepilogo-sticky" id="riepilogo-container">
                </div>
            </div>
        </div>
        <!-- Riepilogo mobile (barra fissa in basso) -->
        <div class="riepilogo-mobile" id="riepilogo-mobile">
        </div>
    `;

    // Renderizza ogni sezione
    for (const sez of sezioni) {
        const body = document.getElementById(`body-${sez.id}`);
        if (body && sez.render) {
            sez.render(body);
        }
    }

    // Renderizza riepilogo
    renderRiepilogo(document.getElementById('riepilogo-container'));
    renderRiepilogoMobile(document.getElementById('riepilogo-mobile'));
}
