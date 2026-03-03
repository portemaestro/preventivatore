// Form modale per creare/modificare rivenditore
import { api } from '../../api.js';
import { AGENZIE, PAGAMENTI } from '../../config.js';
import { creaModale, mostraNotifica } from './componenti_admin.js';

/**
 * Apre il form rivenditore in un modale
 * @param {object|null} rivenditore - dati esistenti (null = nuovo)
 * @param {Function} onSalvato - callback dopo salvataggio
 */
export function apriFormRivenditore(rivenditore, onSalvato) {
    const isModifica = !!rivenditore;
    const titolo = isModifica ? `Modifica: ${rivenditore.ragione_sociale}` : 'Nuovo Rivenditore';

    const corpo = `
        <form id="form-rivenditore">
            <h6 class="text-brand mb-3"><i class="bi bi-building me-1"></i>Anagrafica</h6>
            <div class="row g-2 mb-3">
                <div class="col-md-8">
                    <label class="form-label">Ragione Sociale *</label>
                    <input type="text" class="form-control form-control-sm" name="ragione_sociale"
                           value="${rivenditore?.ragione_sociale || ''}" required>
                </div>
                <div class="col-md-4">
                    <label class="form-label">Rif.</label>
                    <input type="text" class="form-control form-control-sm" name="rif"
                           value="${rivenditore?.rif || ''}">
                </div>
            </div>
            <div class="row g-2 mb-3">
                <div class="col-md-6">
                    <label class="form-label">Indirizzo</label>
                    <input type="text" class="form-control form-control-sm" name="indirizzo"
                           value="${rivenditore?.indirizzo || ''}">
                </div>
                <div class="col-md-2">
                    <label class="form-label">CAP</label>
                    <input type="text" class="form-control form-control-sm" name="cap" maxlength="5"
                           value="${rivenditore?.cap || ''}">
                </div>
                <div class="col-md-3">
                    <label class="form-label">Città</label>
                    <input type="text" class="form-control form-control-sm" name="citta"
                           value="${rivenditore?.citta || ''}">
                </div>
                <div class="col-md-1">
                    <label class="form-label">Prov.</label>
                    <input type="text" class="form-control form-control-sm" name="provincia" maxlength="2"
                           value="${rivenditore?.provincia || ''}">
                </div>
            </div>
            <div class="row g-2 mb-3">
                <div class="col-md-6">
                    <label class="form-label">P.IVA</label>
                    <input type="text" class="form-control form-control-sm" name="piva"
                           value="${rivenditore?.piva || ''}">
                </div>
                <div class="col-md-6">
                    <label class="form-label">Agenzia</label>
                    <select class="form-select form-select-sm" name="agenzia">
                        <option value="">— Nessuna —</option>
                        ${AGENZIE.map(a => `<option value="${a}" ${rivenditore?.agenzia === a ? 'selected' : ''}>${a}</option>`).join('')}
                    </select>
                </div>
            </div>

            <h6 class="text-brand mb-3 mt-4"><i class="bi bi-percent me-1"></i>Condizioni commerciali</h6>
            <div class="row g-2 mb-3">
                <div class="col-md-4">
                    <label class="form-label">Sconto default</label>
                    <input type="text" class="form-control form-control-sm" name="sconto_default"
                           placeholder="es. 50, 50+10" value="${rivenditore?.sconto_default || ''}">
                </div>
                <div class="col-md-8">
                    <label class="form-label">Pagamento default</label>
                    <select class="form-select form-select-sm" name="pagamento_default">
                        <option value="">— Nessuno —</option>
                        ${PAGAMENTI.map(p => `<option value="${p}" ${rivenditore?.pagamento_default === p ? 'selected' : ''}>${p}</option>`).join('')}
                    </select>
                </div>
            </div>

            ${isModifica ? `
                <h6 class="text-brand mb-3 mt-4"><i class="bi bi-key me-1"></i>Credenziali accesso</h6>
                ${rivenditore.username ? `
                    <div class="alert alert-info py-2 small">
                        <i class="bi bi-person-check me-1"></i>
                        Username: <strong>${rivenditore.username}</strong>
                    </div>
                    <div class="row g-2 mb-2">
                        <div class="col-md-6">
                            <label class="form-label">Nuova password (lascia vuoto per non cambiare)</label>
                            <input type="password" class="form-control form-control-sm" name="nuova_password"
                                   placeholder="Nuova password" minlength="6">
                        </div>
                    </div>
                ` : `
                    <div class="alert alert-warning py-2 small">
                        <i class="bi bi-exclamation-triangle me-1"></i>
                        Nessun accesso configurato. Compila per creare le credenziali.
                    </div>
                    <div class="row g-2 mb-2">
                        <div class="col-md-6">
                            <label class="form-label">Username</label>
                            <input type="text" class="form-control form-control-sm" name="nuovo_username"
                                   placeholder="Username">
                        </div>
                        <div class="col-md-6">
                            <label class="form-label">Password</label>
                            <input type="password" class="form-control form-control-sm" name="nuova_password"
                                   placeholder="Password" minlength="6">
                        </div>
                    </div>
                `}
            ` : `
                <h6 class="text-brand mb-3 mt-4"><i class="bi bi-key me-1"></i>Credenziali accesso (opzionale)</h6>
                <div class="row g-2 mb-2">
                    <div class="col-md-6">
                        <label class="form-label">Username</label>
                        <input type="text" class="form-control form-control-sm" name="nuovo_username"
                               placeholder="Username">
                    </div>
                    <div class="col-md-6">
                        <label class="form-label">Password</label>
                        <input type="password" class="form-control form-control-sm" name="nuova_password"
                               placeholder="Password" minlength="6">
                    </div>
                </div>
            `}
        </form>
    `;

    creaModale({
        titolo,
        corpo,
        grandezza: 'lg',
        testoSalva: isModifica ? 'Aggiorna' : 'Crea Rivenditore',
        onSalva: async (modale) => {
            const form = document.getElementById('form-rivenditore');
            const datiForm = new FormData(form);
            const dati = Object.fromEntries(datiForm.entries());

            if (!dati.ragione_sociale?.trim()) {
                throw new Error('Ragione sociale obbligatoria');
            }

            // Salva anagrafica
            const anagrafica = {
                ragione_sociale: dati.ragione_sociale.trim(),
                rif: dati.rif || null,
                indirizzo: dati.indirizzo || null,
                cap: dati.cap || null,
                citta: dati.citta || null,
                provincia: dati.provincia || null,
                piva: dati.piva || null,
                agenzia: dati.agenzia || null,
                sconto_default: dati.sconto_default || null,
                pagamento_default: dati.pagamento_default || null
            };

            let rivId;

            if (isModifica) {
                await api.put(`/rivenditori/${rivenditore.id}`, anagrafica);
                rivId = rivenditore.id;
            } else {
                const nuovo = await api.post('/rivenditori', anagrafica);
                rivId = nuovo.id;
            }

            // Gestione credenziali
            const nuovoUsername = dati.nuovo_username?.trim();
            const nuovaPassword = dati.nuova_password?.trim();

            if (nuovoUsername && nuovaPassword) {
                // Crea nuovo utente
                await api.post('/utenti', {
                    username: nuovoUsername,
                    password: nuovaPassword,
                    rivenditore_id: rivId
                });
            } else if (nuovaPassword && isModifica && rivenditore.username) {
                // Cambia password utente esistente — serve utente_id
                const rivCompleto = await api.get(`/rivenditori/${rivId}`);
                if (rivCompleto.utente_id) {
                    await api.put(`/utenti/${rivCompleto.utente_id}/password`, {
                        password: nuovaPassword
                    });
                }
            }

            modale.hide();
            mostraNotifica(isModifica ? 'Rivenditore aggiornato' : 'Rivenditore creato', 'success');
            if (onSalvato) onSalvato();
        }
    });
}
