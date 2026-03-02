// Calcolo prezzi lato client - port del backend + logica completa configuratore
import { getStato } from './stato.js';
import { arrotonda2 } from './utils/formattazione.js';

// ===== Funzioni base (port dal backend) =====

/**
 * Calcola lo sconto composto (es. "50+10" → prima -50%, poi -10% sul risultato)
 */
export function calcolaSconto(importo, sconto) {
    if (!sconto || sconto === '0' || sconto === '') return importo;
    const parti = sconto.split('+').map(s => parseFloat(s.trim()));
    let risultato = importo;
    for (const percentuale of parti) {
        risultato = risultato * (1 - percentuale / 100);
    }
    return arrotonda2(risultato);
}

/**
 * Importo dello sconto (quanto si toglie)
 */
export function importoSconto(importo, sconto) {
    return arrotonda2(importo - calcolaSconto(importo, sconto));
}

/**
 * Ricalcola riepilogo economico da array di posizioni
 */
export function calcolaRiepilogo(posizioni, sconto, imballo = 0, trasporto = 0) {
    let totale_materiali = 0;
    let totale_non_scontabile = 0;

    for (const pos of posizioni) {
        const totale_posizione = arrotonda2(pos.prezzo_unitario * (pos.quantita || 1));
        if (pos.scontabile) {
            totale_materiali += totale_posizione;
        } else {
            totale_non_scontabile += totale_posizione;
        }
    }

    totale_materiali = arrotonda2(totale_materiali);
    totale_non_scontabile = arrotonda2(totale_non_scontabile);

    const netto_materiali = calcolaSconto(totale_materiali, sconto);
    const imponibile = arrotonda2(netto_materiali + totale_non_scontabile + imballo + trasporto);
    const iva = arrotonda2(imponibile * 0.22);
    const totale = arrotonda2(imponibile + iva);

    return {
        totale_materiali,
        netto_materiali,
        totale_non_scontabile,
        imballo: arrotonda2(imballo),
        trasporto: arrotonda2(trasporto),
        imponibile,
        iva,
        totale
    };
}

// ===== Logica calcolo dal configuratore =====

/**
 * Determina se le misure sono fuori standard
 */
function isFuoriStandard(larghezza, altezza) {
    return larghezza > 900 || altezza > 2100;
}

/**
 * Calcola supplemento fuori standard dalla tabella
 */
function calcolaSupplementoFuoriStandard(larghezza, altezza, supplementi) {
    if (!supplementi || !supplementi.supplementi_dimensioni) return 0;
    // Misure standard: fino a 900 x 2100
    if (larghezza <= 900 && altezza >= 1905 && altezza <= 2100) return 0;

    const tabella = supplementi.supplementi_dimensioni.tabella;
    let riga = null;

    for (const r of tabella) {
        if (r.larghezza === 'fino_a_105' && larghezza <= 1050) { riga = r; break; }
        if (r.larghezza === 'da_105_5_a_110' && larghezza > 1050 && larghezza <= 1100) { riga = r; break; }
        if (r.larghezza === 'da_110_5_a_120' && larghezza > 1100 && larghezza <= 1200) { riga = r; break; }
    }

    if (!riga) return 0;

    if (altezza <= 1900) return riga.altezza_fino_190 || 0;
    if (altezza <= 2400) return riga.altezza_190_5_a_240 || 0;
    if (altezza <= 2500) return riga.altezza_240_5_a_250 || 0;
    if (altezza <= 2900) return riga.altezza_250_5_a_290 || 0;

    return 0;
}

/**
 * Determina il numero di ante dalla configurazione
 */
function getNumeroAnte(configurazione) {
    if (configurazione.startsWith('2_ante')) return 2;
    return 1;
}

/**
 * Determina se la configurazione è simmetrica
 */
function isSimmetrica(configurazione) {
    return configurazione.includes('simmetric');
}

/**
 * Calcola il prezzo base del blindato
 */
function calcolaPrezzoBlindata(prev) {
    const { listino } = getStato();
    const { blindato } = prev;

    let prezzo_base = 0;

    if (blindato.tipo_cerniera === 'scomparsa') {
        // Cerniere a scomparsa
        const datiCS = listino.optional;
        if (!datiCS || !datiCS.cerniere_scomparsa) return 0;
        const modelli = datiCS.cerniere_scomparsa.modelli;
        const modello = modelli.find(m => m.modello.toLowerCase() === blindato.modello.toLowerCase());
        if (!modello) return 0;

        prezzo_base = modello.anta_principale?.prezzo || 0;

        // Se 2 ante, aggiungi antina
        if (getNumeroAnte(blindato.configurazione_ante) === 2) {
            if (isSimmetrica(blindato.configurazione_ante)) {
                prezzo_base += modello.antina_simmetrica?.prezzo || modello.anta_principale?.prezzo || 0;
            } else {
                prezzo_base += modello.antina_asimmetrica?.prezzo || 0;
            }
        }
    } else {
        // Cerniere a vista
        const dati = listino.blindati;
        if (!dati) return 0;
        const modelloData = dati.modelli_cerniere_vista[blindato.modello];
        if (!modelloData) return 0;

        const numAnte = getNumeroAnte(blindato.configurazione_ante);

        if (numAnte === 1) {
            prezzo_base = modelloData['1_anta']?.prezzo_base || 0;
        } else if (isSimmetrica(blindato.configurazione_ante)) {
            // 2 ante simmetriche: anta + anta simmetrica
            const prezzoAnta = modelloData['1_anta']?.prezzo_base || 0;
            const prezzoAntaSim = dati.ante_simmetriche?.[blindato.modello] || 0;
            prezzo_base = prezzoAnta + prezzoAntaSim;
        } else {
            // 2 ante asimmetriche
            prezzo_base = modelloData['2_ante_asimmetriche']?.prezzo_base || 0;
        }
    }

    return prezzo_base;
}

/**
 * Calcola supplemento serratura
 */
function calcolaSupplementoSerratura(serratura) {
    const { listino } = getStato();
    const dati = listino.optional;
    if (!dati) return 0;

    switch (serratura) {
        case 'motorizzata_attuatore':
            return dati.serrature_motorizzate?.serratura_motorizzata_iseo_x1r?.modelli?.find(m => m.modello === 'Attuatore')?.prezzo || 1680;
        case 'motorizzata_easy':
            return dati.serrature_motorizzate?.serratura_motorizzata_iseo_x1r?.modelli?.find(m => m.modello === 'Easy')?.prezzo || 1970;
        case 'motorizzata_smart':
            return dati.serrature_motorizzate?.serratura_motorizzata_iseo_x1r?.modelli?.find(m => m.modello === 'Smart')?.prezzo || 2360;
        case 'multiservizio':
            return dati.optional_vari?.find(o => o.codice === 'SERMUL')?.prezzo || 340;
        case 'sblocco_rapido':
            return dati.optional_vari?.find(o => o.codice === 'SERRSR')?.prezzo || 110;
        default:
            return 0;
    }
}

/**
 * Calcola supplemento cilindro
 */
function calcolaSupplementoCilindro(cilindro) {
    const { listino } = getStato();
    const dati = listino.optional;
    if (!dati) return 0;

    if (cilindro === 'codolo_pomolino') return dati.cilindro?.cilindro_codolo_pomolino || 90;
    if (cilindro === 'evva_mcs') return dati.cilindro?.evva_mcs?.prezzo || 700;
    return 0;
}

/**
 * Calcola supplemento defender
 */
function calcolaSupplementoDefender(defender) {
    const { listino } = getStato();
    const dati = listino.optional;
    if (!dati) return 0;

    const opzione = dati.defender?.opzioni?.find(o =>
        o.codice.toLowerCase().replace(/\s+/g, '_') === defender ||
        o.descrizione.toLowerCase().includes(defender.replace(/_/g, ' '))
    );
    if (opzione && opzione.prezzo !== 'standard') return opzione.prezzo || 0;
    return 0;
}

/**
 * Calcola supplemento spioncino
 */
function calcolaSupplementoSpioncino(spioncino) {
    if (spioncino === 'digitale_wifi') return 360;
    return 0;
}

/**
 * Calcola supplemento soglia
 */
function calcolaSupplementoSoglia(soglia) {
    if (soglia === 'battuta_pavimento') return 120;
    return 0;
}

/**
 * Calcola supplemento verniciatura telaio
 */
function calcolaSupplementoTelaio(prev) {
    const { listino } = getStato();
    const dati = listino.telai;
    if (!dati) return 0;

    const { telaio, blindato } = prev;
    const numAnte = getNumeroAnte(blindato.configurazione_ante);
    const chiaveAnte = numAnte === 1 ? '1_anta' : '2_ante';
    let supplemento = 0;

    // Supplemento telaio ridotto
    if (telaio.tipo === 'ridotto_l' || telaio.tipo === 'ridotto_z') {
        const larghezza = blindato.larghezza <= 1050 ? 'fino_a_105' : 'oltre_105';
        const riga = dati.telai_ridotti_ristrutturazione?.tabella?.find(r => r.larghezza === larghezza);
        if (riga) {
            supplemento += blindato.altezza <= 2400 ? riga.altezza_fino_240 : riga.altezza_da_240_5_a_260;
        }
    }

    // Supplemento telaio ad adattare
    if (telaio.tipo === 'ad_adattare') {
        supplemento += dati.telaio_ad_adattare?.prezzi?.['1_pezzo'] || 540;
    }

    // Supplemento verniciatura bicolore
    const int = telaio.colore_interno;
    const est = telaio.colore_esterno;

    if (int === est) {
        // Monocolore
        if (int === 'bianco') {
            supplemento += dati.verniciatura_monocolore?.colori?.bianco_simil_9010?.[chiaveAnte] || 0;
        } else if (int === 'ral') {
            supplemento += dati.verniciatura_monocolore?.colori?.tutti_i_ral?.[chiaveAnte] || 0;
        }
    } else {
        // Bicolore
        const chiaveCombo = `int_${int}_est_${est}`;
        const combo = dati.verniciatura_bicolore?.combinazioni?.[chiaveCombo];
        if (combo) {
            supplemento += combo[chiaveAnte] || 0;
        }
    }

    return supplemento;
}

/**
 * Calcola imballo automatico
 */
function calcolaImballo(prev) {
    const { listino } = getStato();
    const dati = listino.trasporto;
    if (!dati) return 40;

    const { blindato, optional } = prev;
    const numAnte = getNumeroAnte(blindato.configurazione_ante);

    let imballo;
    if (numAnte === 1) {
        imballo = (blindato.larghezza > 900 || blindato.altezza > 2200)
            ? dati.imballo?.tariffe?.anta_singola_oltre_90x220 || 60
            : dati.imballo?.tariffe?.anta_singola_fino_90x220 || 40;
    } else {
        imballo = blindato.altezza > 2200
            ? dati.imballo?.tariffe?.anta_doppia_altezza_oltre_220 || 80
            : dati.imballo?.tariffe?.anta_doppia_altezza_fino_220 || 60;
    }

    if (optional.sopraluce || optional.fiancoluce_monolaterale || optional.fiancoluce_bilaterale) {
        imballo += dati.imballo?.tariffe?.supplemento_sopraluce_fiancoluce || 20;
    }

    return imballo;
}

/**
 * Calcola trasporto automatico
 */
function calcolaTrasporto(prev) {
    const { listino } = getStato();
    const dati = listino.trasporto;
    if (!dati) return 0;

    const { blindato, riepilogo } = prev;
    const regione = riepilogo.regione_trasporto;
    if (!regione || prev.intestazione.mezzo_trasporto === 'Mittente') return 0;

    // Determina fascia dimensionale
    let fascia;
    if (blindato.larghezza <= 950 && blindato.altezza <= 2150) {
        fascia = 'fino_95x215';
    } else if (blindato.larghezza <= 1100 && blindato.altezza <= 2250) {
        fascia = 'da_95_1x215_1_a_110x225';
    } else {
        fascia = 'da_225_1_a_250';
    }

    const tariffe = dati.trasporto?.tariffe?.[fascia];
    if (!tariffe) return 0;

    let costo = tariffe[regione] || 0;

    // x2 per 2 ante
    const numAnte = getNumeroAnte(blindato.configurazione_ante);
    if (numAnte === 2) costo *= 2;

    return costo;
}

/**
 * Calcola il riepilogo completo partendo dallo stato del configuratore
 * @returns {object} { posizioni: [], riepilogo: {...} }
 */
export function calcolaRiepilogoCompleto() {
    const { preventivo: prev, listino } = getStato();
    if (!listino.blindati) return { posizioni: [], riepilogo: calcolaRiepilogo([], '0') };

    const posizioni = [];
    let numPos = 1;

    // --- 1. BLINDATO ---
    const prezzoBase = calcolaPrezzoBlindata(prev);
    if (prezzoBase > 0) {
        const numAnte = getNumeroAnte(prev.blindato.configurazione_ante);
        const configLabel = prev.blindato.configurazione_ante
            .replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
            .replace('Dx', 'Destra').replace('Sx', 'Sinistra');
        const modelloLabel = prev.blindato.tipo_cerniera === 'scomparsa'
            ? prev.blindato.modello.charAt(0).toUpperCase() + prev.blindato.modello.slice(1)
            : (listino.blindati.modelli_cerniere_vista[prev.blindato.modello]?.nome || prev.blindato.modello);

        posizioni.push({
            numero: numPos++,
            tipo: 'blindato',
            descrizione: `Blindato ${modelloLabel} - ${configLabel} - ${prev.blindato.larghezza}x${prev.blindato.altezza}mm`,
            prezzo_unitario: prezzoBase,
            quantita: prev.blindato.quantita || 1,
            scontabile: true
        });
    }

    // Supplemento fuori standard
    const suppFS = calcolaSupplementoFuoriStandard(prev.blindato.larghezza, prev.blindato.altezza, listino.supplementi);
    if (suppFS > 0) {
        posizioni.push({
            numero: numPos++,
            tipo: 'supplemento',
            descrizione: 'Supplemento fuori standard',
            prezzo_unitario: suppFS,
            quantita: prev.blindato.quantita || 1,
            scontabile: true
        });
    }

    // --- 2. SERRATURA ---
    const suppSerr = calcolaSupplementoSerratura(prev.blindato.serratura);
    if (suppSerr > 0) {
        const labelSerr = {
            'motorizzata_attuatore': 'Serratura Motorizzata Attuatore X1R',
            'motorizzata_easy': 'Serratura Motorizzata Easy X1R',
            'motorizzata_smart': 'Serratura Motorizzata Smart X1R',
            'multiservizio': 'Serratura Multiservizio',
            'sblocco_rapido': 'Serratura Sblocco Rapido'
        };
        posizioni.push({
            numero: numPos++,
            tipo: 'serratura',
            descrizione: labelSerr[prev.blindato.serratura] || 'Serratura',
            prezzo_unitario: suppSerr,
            quantita: prev.blindato.quantita || 1,
            scontabile: true
        });
    }

    // --- 3. CILINDRO ---
    const suppCil = calcolaSupplementoCilindro(prev.blindato.cilindro);
    if (suppCil > 0) {
        posizioni.push({
            numero: numPos++,
            tipo: 'cilindro',
            descrizione: prev.blindato.cilindro === 'evva_mcs' ? 'Cilindro EVVA MCS' : 'Cilindro Codolo con Pomolino',
            prezzo_unitario: suppCil,
            quantita: prev.blindato.quantita || 1,
            scontabile: true
        });
    }

    // --- 4. DEFENDER ---
    const suppDef = calcolaSupplementoDefender(prev.blindato.defender);
    if (suppDef > 0) {
        posizioni.push({
            numero: numPos++,
            tipo: 'defender',
            descrizione: `Defender ${prev.blindato.defender.replace(/_/g, ' ')}`,
            prezzo_unitario: suppDef,
            quantita: prev.blindato.quantita || 1,
            scontabile: true
        });
    }

    // --- 5. SPIONCINO ---
    const suppSpio = calcolaSupplementoSpioncino(prev.blindato.spioncino);
    if (suppSpio > 0) {
        posizioni.push({
            numero: numPos++,
            tipo: 'spioncino',
            descrizione: 'Spioncino Digitale WiFi',
            prezzo_unitario: suppSpio,
            quantita: prev.blindato.quantita || 1,
            scontabile: true
        });
    }

    // --- 6. SOGLIA ---
    const suppSoglia = calcolaSupplementoSoglia(prev.blindato.soglia);
    if (suppSoglia > 0) {
        posizioni.push({
            numero: numPos++,
            tipo: 'soglia',
            descrizione: 'Soglia Battuta a Pavimento con Coibentazione',
            prezzo_unitario: suppSoglia,
            quantita: prev.blindato.quantita || 1,
            scontabile: true
        });
    }

    // --- 7. TELAIO ---
    const suppTelaio = calcolaSupplementoTelaio(prev);
    if (suppTelaio > 0) {
        let descTelaio = `Telaio ${prev.telaio.tipo.replace(/_/g, ' ').toUpperCase()}`;
        if (prev.telaio.colore_interno !== 'marrone' || prev.telaio.colore_esterno !== 'marrone') {
            descTelaio += ` - Int: ${prev.telaio.colore_interno}, Est: ${prev.telaio.colore_esterno}`;
        }
        posizioni.push({
            numero: numPos++,
            tipo: 'telaio',
            descrizione: descTelaio,
            prezzo_unitario: suppTelaio,
            quantita: prev.blindato.quantita || 1,
            scontabile: true
        });
    }

    // --- 8. RIVESTIMENTO INTERNO ---
    const suppRivInt = calcolaSupplementoRivestimentoInterno(prev);
    if (suppRivInt > 0) {
        posizioni.push({
            numero: numPos++,
            tipo: 'rivestimento_interno',
            descrizione: `Rivestimento Interno ${prev.rivestimento_interno.tipo} ${prev.rivestimento_interno.finitura}`,
            prezzo_unitario: suppRivInt,
            quantita: prev.blindato.quantita || 1,
            scontabile: true
        });
    }

    // --- 9. RIVESTIMENTO ESTERNO ---
    const suppRivEst = calcolaSupplementoRivestimentoEsterno(prev);
    if (suppRivEst > 0) {
        posizioni.push({
            numero: numPos++,
            tipo: 'rivestimento_esterno',
            descrizione: `Rivestimento Esterno ${prev.rivestimento_esterno.tipo}`,
            prezzo_unitario: suppRivEst,
            quantita: prev.blindato.quantita || 1,
            scontabile: true
        });
    }

    // --- 10. COPRIFILO ---
    const suppCopr = calcolaSupplementoCoprifilo(prev);
    if (suppCopr > 0) {
        posizioni.push({
            numero: numPos++,
            tipo: 'coprifilo',
            descrizione: `${prev.coprifilo.tipo.replace(/_/g, ' ')}`,
            prezzo_unitario: suppCopr,
            quantita: prev.blindato.quantita || 1,
            scontabile: true
        });
    }

    // --- 11. KIT TERMICO ---
    if (prev.optional.kit_termico) {
        const kitTermici = listino.supplementi?.kit_coibentazione_termica?.kit || [];
        const kt = kitTermici.find(k => k.codice === prev.optional.kit_termico);
        if (kt) {
            posizioni.push({
                numero: numPos++,
                tipo: 'kit_termico',
                descrizione: `Kit Coibentazione Termica ${kt.codice} (${kt.descrizione})`,
                prezzo_unitario: kt.prezzo,
                quantita: prev.blindato.quantita || 1,
                scontabile: true
            });
        }
    }

    // --- 12. KIT ACUSTICO ---
    if (prev.optional.kit_acustico) {
        const kitAcustici = listino.supplementi?.kit_acustico?.kit || [];
        const ka = kitAcustici.find(k => k.codice === prev.optional.kit_acustico);
        if (ka) {
            posizioni.push({
                numero: numPos++,
                tipo: 'kit_acustico',
                descrizione: `Kit Acustico ${ka.codice} ${ka.abbattimento_db}dB`,
                prezzo_unitario: ka.prezzo,
                quantita: prev.blindato.quantita || 1,
                scontabile: true
            });
        }
    }

    // --- 13. SFINESTRATURE ---
    if (prev.optional.sfinestrature > 0) {
        const prezziSfin = { 1: 1060, 2: 1590, 3: 2120, 4: 2650 };
        posizioni.push({
            numero: numPos++,
            tipo: 'sfinestratura',
            descrizione: `${prev.optional.sfinestrature} Sfinestratura/e + Vetro Blindato ${prev.optional.vetro_sfinestratura}`,
            prezzo_unitario: prezziSfin[prev.optional.sfinestrature] || 0,
            quantita: prev.blindato.quantita || 1,
            scontabile: true
        });
    }

    // --- 14. OPTIONAL VARI ---
    if (prev.optional.apertura_tirare) {
        posizioni.push({ numero: numPos++, tipo: 'optional', descrizione: 'Apertura a Tirare', prezzo_unitario: 180, quantita: prev.blindato.quantita || 1, scontabile: true });
    }
    if (prev.optional.doppia_maniglia_passante) {
        posizioni.push({ numero: numPos++, tipo: 'optional', descrizione: 'Doppia Maniglia Passante', prezzo_unitario: 80, quantita: prev.blindato.quantita || 1, scontabile: true });
    }
    if (prev.optional.incontro_elettrico) {
        const numAnte = getNumeroAnte(prev.blindato.configurazione_ante);
        posizioni.push({ numero: numPos++, tipo: 'optional', descrizione: 'Incontro Elettrico', prezzo_unitario: numAnte === 1 ? 170 : 225, quantita: prev.blindato.quantita || 1, scontabile: true });
    }
    if (prev.optional.predisposto_senza_rivestimento) {
        posizioni.push({ numero: numPos++, tipo: 'optional', descrizione: 'Predisposto senza rivestimento', prezzo_unitario: -100, quantita: prev.blindato.quantita || 1, scontabile: true });
    }
    if (prev.optional.grata_sfinestratura) {
        posizioni.push({ numero: numPos++, tipo: 'optional', descrizione: 'Grata per Sfinestratura', prezzo_unitario: 1150, quantita: prev.blindato.quantita || 1, scontabile: true });
    }
    if (prev.optional.supplemento_rotox_classe4) {
        posizioni.push({ numero: numPos++, tipo: 'optional', descrizione: 'Supplemento Rotox Classe 4', prezzo_unitario: 730, quantita: prev.blindato.quantita || 1, scontabile: true });
    }
    if (prev.optional.controtelaio_guida_cappotto) {
        posizioni.push({ numero: numPos++, tipo: 'optional', descrizione: 'Controtelaio con Guida Cappotto', prezzo_unitario: 110, quantita: prev.blindato.quantita || 1, scontabile: true });
    }

    // --- 15. MANIGLIONE ---
    const prezzoManig = calcolaPrezzomaniglione(prev);
    if (prezzoManig > 0) {
        posizioni.push({
            numero: numPos++,
            tipo: 'maniglione',
            descrizione: `Maniglione ${prev.maniglione.marca} ${prev.maniglione.modello} ${prev.maniglione.lunghezza}mm`,
            prezzo_unitario: prezzoManig,
            quantita: prev.blindato.quantita || 1,
            scontabile: true
        });
    }

    // --- 16. POSA IN OPERA (non scontabile) ---
    if (prev.accessori.posa_in_opera) {
        posizioni.push({
            numero: numPos++,
            tipo: 'posa',
            descrizione: 'Posa in Opera',
            prezzo_unitario: prev.accessori.prezzo_posa || 200,
            quantita: prev.blindato.quantita || 1,
            scontabile: false
        });
    }

    // --- 17. PRODUZIONE EXPRESS (non scontabile) ---
    if (prev.accessori.produzione_express) {
        const express = { platinum: 250, gold: 140, silver: 100 };
        const label = { platinum: 'Platinum 5gg', gold: 'Gold 10gg', silver: 'Silver 15gg' };
        posizioni.push({
            numero: numPos++,
            tipo: 'express',
            descrizione: `Produzione Express ${label[prev.accessori.produzione_express]}`,
            prezzo_unitario: express[prev.accessori.produzione_express] || 0,
            quantita: prev.blindato.quantita || 1,
            scontabile: false
        });
    }

    // --- 18. KIT LED ---
    if (prev.accessori.kit_led) {
        const ledPrezzi = listino.optional?.maniglioni?.kit_illuminazione_led?.modelli || [];
        const led = ledPrezzi.find(l => l.altezza === prev.accessori.altezza_led) || { prezzo: 380 };
        posizioni.push({
            numero: numPos++,
            tipo: 'kit_led',
            descrizione: `Kit Illuminazione LED h.${prev.accessori.altezza_led}`,
            prezzo_unitario: led.prezzo || 380,
            quantita: prev.blindato.quantita || 1,
            scontabile: true
        });
    }

    // --- 19. FERMAPANNELLO ---
    if (prev.accessori.fermapannello) {
        posizioni.push({
            numero: numPos++,
            tipo: 'fermapannello',
            descrizione: 'Fermapannello Interno in Legno',
            prezzo_unitario: 150,
            quantita: prev.blindato.quantita || 1,
            scontabile: true
        });
    }

    // --- 20. GARANZIA ALL RISK (non scontabile) ---
    if (prev.accessori.garanzia_all_risk) {
        const numAnte = getNumeroAnte(prev.blindato.configurazione_ante);
        const fs = isFuoriStandard(prev.blindato.larghezza, prev.blindato.altezza);
        const prezzoGaranzia = (fs || numAnte === 2) ? 38 : 18;
        posizioni.push({
            numero: numPos++,
            tipo: 'garanzia',
            descrizione: 'Garanzia All Risk',
            prezzo_unitario: prezzoGaranzia,
            quantita: prev.blindato.quantita || 1,
            scontabile: false
        });
    }

    // Calcola imballo e trasporto
    const imballo = prev.riepilogo.imballo_manuale != null
        ? prev.riepilogo.imballo_manuale
        : calcolaImballo(prev);
    const trasporto = prev.riepilogo.trasporto_manuale != null
        ? prev.riepilogo.trasporto_manuale
        : calcolaTrasporto(prev);

    const riepilogo = calcolaRiepilogo(posizioni, prev.riepilogo.sconto, imballo, trasporto);

    return { posizioni, riepilogo };
}

// ===== Funzioni helper per rivestimenti e coprifilo =====

function calcolaSupplementoRivestimentoInterno(prev) {
    const { listino } = getStato();
    if (prev.rivestimento_interno.predisposto) return 0;

    const fs = isFuoriStandard(prev.blindato.larghezza, prev.blindato.altezza);

    if (prev.rivestimento_interno.tipo === 'laminato') {
        const dati = listino.rivestimenti?.laminati;
        if (!dati) return 0;

        if (prev.rivestimento_interno.finitura === 'matrix') {
            return fs ? (dati.finitura_optional_matrix?.supplemento_fuori_standard || 120) : (dati.finitura_optional_matrix?.supplemento_misura_standard || 60);
        }
        if (prev.rivestimento_interno.finitura === 'long_life') {
            return fs ? (dati.finitura_optional_long_life?.supplemento_fuori_standard || 240) : (dati.finitura_optional_long_life?.supplemento_misura_standard || 120);
        }
        return 0; // standard incluso
    }

    // Per altri tipi (okoumè, MDF, impiallacciato) servirebbero prezzi specifici dai JSON
    // Per ora restituiamo valori indicativi
    if (prev.rivestimento_interno.tipo === 'okoume') return 580;
    if (prev.rivestimento_interno.tipo === 'mdf') return 400;
    if (prev.rivestimento_interno.tipo === 'impiallacciato') return 280;

    return 0;
}

function calcolaSupplementoRivestimentoEsterno(prev) {
    if (prev.rivestimento_esterno.tipo === 'laminato') {
        // Laminato standard esterno incluso
        const { listino } = getStato();
        const dati = listino.rivestimenti?.laminati;
        if (!dati) return 0;
        const fs = isFuoriStandard(prev.blindato.larghezza, prev.blindato.altezza);
        if (prev.rivestimento_esterno.finitura === 'matrix') {
            return fs ? (dati.finitura_optional_matrix?.supplemento_fuori_standard || 120) : (dati.finitura_optional_matrix?.supplemento_misura_standard || 60);
        }
        if (prev.rivestimento_esterno.finitura === 'long_life') {
            return fs ? (dati.finitura_optional_long_life?.supplemento_fuori_standard || 240) : (dati.finitura_optional_long_life?.supplemento_misura_standard || 120);
        }
        return 0;
    }

    // Prezzi indicativi per altri materiali
    if (prev.rivestimento_esterno.tipo === 'okoume') return 580;
    if (prev.rivestimento_esterno.tipo === 'alluminio') return 830;
    if (prev.rivestimento_esterno.tipo === 'pvc') return 650;
    if (prev.rivestimento_esterno.tipo === 'bachelite') return 350;
    if (prev.rivestimento_esterno.tipo === 'mdf') return 400;

    return 0;
}

function calcolaSupplementoCoprifilo(prev) {
    const { listino } = getStato();

    if (prev.coprifilo.tipo === 'nessuno') return 0;

    if (prev.coprifilo.tipo === 'laminato') {
        const dati = listino.rivestimenti?.laminati?.coprifili_laminati;
        if (!dati) return 130;
        const larg = dati.larghezze?.find(l => l.larghezza === prev.coprifilo.larghezza);
        return larg?.prezzo || 130;
    }
    if (prev.coprifilo.tipo === 'metallico_piatto') return 60;
    if (prev.coprifilo.tipo === 'imbotte_laminato') {
        const dati = listino.rivestimenti?.laminati?.imbotti_laminati;
        if (!dati) return 405;
        const riga = dati.tabella?.find(r => r.profondita_muro === prev.coprifilo.profondita_muro);
        return riga?.['fino_90x210'] || 405;
    }
    if (prev.coprifilo.tipo === 'imbotte_impiallacciato') return 480;
    if (prev.coprifilo.tipo === 'okoume') return 280;

    return 0;
}

function calcolaPrezzomaniglione(prev) {
    if (!prev.maniglione.presente) return 0;

    const { listino } = getStato();
    const dati = listino.optional?.maniglioni;
    if (!dati) return 0;

    if (prev.maniglione.marca === 'hoppe') {
        const modello = dati.hoppe?.modelli?.[prev.maniglione.modello];
        if (!modello) return 0;
        const finitura = modello.finiture?.[prev.maniglione.finitura];
        if (!finitura) return 0;
        const misura = finitura.find(m => m.lunghezza === prev.maniglione.lunghezza);
        return misura?.prezzo || 0;
    }

    if (prev.maniglione.marca === 'aluform') {
        // Cerchiamo il prezzo nella serie corrispondente
        for (const serieKey of Object.keys(dati.aluform || {})) {
            if (serieKey === 'nota') continue;
            const serie = dati.aluform[serieKey];
            if (!serie?.modelli) continue;
            const modello = serie.modelli.find(m => m.codice_base === prev.maniglione.modello || m.codice === prev.maniglione.modello);
            if (modello) return modello.effetto_inox || 0;
        }
    }

    return 0;
}
