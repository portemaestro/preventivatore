// Stato centralizzato dell'applicazione

const stato = {
    // Dati listino (cachati dopo primo caricamento)
    listino: {
        blindati: null,
        telai: null,
        rivestimenti: {
            laminati: null,
            impiallacciati: null,
            stratificati: null,
            okoume: null,
            alluminio: null,
            pvc: null
        },
        optional: null,        // include serrature_motorizzate, maniglioni, sfinestrature, cerniere_scomparsa
        trasporto: null,
        supplementi: null
    },
    listinoCaricato: false,

    // Preventivo corrente in configurazione
    preventivo: creaPreventivoVuoto()
};

/**
 * Crea un oggetto preventivo vuoto con valori di default
 */
export function creaPreventivoVuoto() {
    return {
        // Intestazione
        intestazione: {
            rivenditore_id: null,
            agenzia: 'DIREZIONALE',
            responsabile: 'GIUSEPPE',
            pagamento: '50% ordine - 50% merce pronta',
            destinazione: '',
            mezzo_trasporto: 'Corriere',
            giorni_evasione: 45,
            note: ''
        },
        // Blindato
        blindato: {
            tipo_cerniera: 'vista',           // 'vista' o 'scomparsa'
            modello: 'bplus',
            configurazione_ante: '1_anta_spingere_dx',
            // Misure
            larghezza: 900,
            altezza: 2100,
            larghezza_anta_primaria: null,     // per 2 ante
            larghezza_anta_secondaria: null,   // per 2 ante
            // Serratura
            serratura: 'standard',            // 'standard', 'motorizzata_attuatore', 'motorizzata_easy', 'motorizzata_smart', 'multiservizio', 'sblocco_rapido'
            // Cilindro
            cilindro: 'standard',             // 'standard', 'codolo_pomolino', 'evva_mcs'
            // Defender
            defender: 'standard',
            // Maniglia interna
            maniglia_interna: 'standard',
            // Pomolo esterno
            pomolo_esterno: 'standard',
            // Limitatore
            limitatore: 'standard',
            // Spioncino
            spioncino: 'compreso',            // 'compreso', 'a_parte_no_foro', 'escluso', 'digitale_wifi'
            // Soglia
            soglia: 'mobile_paraspifferi',    // 'mobile_paraspifferi', 'fissa_alluminio', 'battuta_pavimento', 'slim'
            // Quantità
            quantita: 1
        },
        // Telaio
        telaio: {
            tipo: '65c',                      // '65c', 'ridotto_l', 'ridotto_z', 'ad_adattare', 'complanare', 'plana'
            colore_interno: 'marrone',
            colore_esterno: 'marrone',
            ral_interno: '',
            ral_esterno: ''
        },
        // Rivestimento interno
        rivestimento_interno: {
            tipo: 'laminato',                 // 'laminato', 'mdf', 'okoume', 'impiallacciato'
            finitura: 'standard',             // 'standard', 'matrix', 'long_life'
            colore: 'T2',
            modello_pantografo: '',
            predisposto: false                // senza rivestimento
        },
        // Rivestimento esterno
        rivestimento_esterno: {
            tipo: 'laminato',                 // 'laminato', 'okoume', 'alluminio', 'pvc', 'bachelite', 'mdf'
            finitura: 'standard',
            colore: 'T2',
            modello: '',
            ambiente: 'condominio'            // per okoumè: 'condominio' o 'esposto'
        },
        // Coprifilo / Imbotte
        coprifilo: {
            tipo: 'nessuno',                  // 'nessuno', 'laminato', 'metallico_piatto', 'imbotte_laminato', 'imbotte_impiallacciato', 'okoume'
            larghezza: '8cm',
            profondita_muro: '',
            colore: ''
        },
        // Optional
        optional: {
            kit_termico: '',                  // codice KT o vuoto
            kit_acustico: '',                 // codice KA o vuoto
            sfinestrature: 0,                 // 0-4
            vetro_sfinestratura: 'sabbiato',  // 'sabbiato', 'trasparente'
            apertura_tirare: false,
            doppia_maniglia_passante: false,
            incontro_elettrico: false,
            predisposto_senza_rivestimento: false,
            grata_sfinestratura: false,
            supplemento_rotox_classe4: false,  // per Moving
            controtelaio_guida_cappotto: false,
            sopraluce: false,
            fiancoluce_monolaterale: false,
            fiancoluce_bilaterale: false
        },
        // Maniglione
        maniglione: {
            presente: false,
            marca: 'hoppe',                   // 'hoppe', 'aluform'
            modello: '',
            finitura: 'cromo_satinato',
            lunghezza: 1000
        },
        // Accessori
        accessori: {
            posa_in_opera: false,
            prezzo_posa: 200,
            produzione_express: '',           // '', 'platinum', 'gold', 'silver'
            kit_led: false,
            altezza_led: 1700,
            fermapannello: false,
            garanzia_all_risk: true
        },
        // Riepilogo economico
        riepilogo: {
            sconto: '50',
            regione_trasporto: 'puglia',
            imballo_manuale: null,            // null = auto-calcolato
            trasporto_manuale: null           // null = auto-calcolato
        }
    };
}

/**
 * Ottieni lo stato corrente (read-only)
 */
export function getStato() {
    return stato;
}

/**
 * Aggiorna una sezione dello stato del preventivo
 * @param {string} sezione - es. 'blindato', 'telaio', ecc.
 * @param {object} dati - campi da aggiornare
 */
export function aggiornaStato(sezione, dati) {
    if (stato.preventivo[sezione]) {
        Object.assign(stato.preventivo[sezione], dati);
    }
    // Notifica gli ascoltatori
    window.dispatchEvent(new CustomEvent('stato-aggiornato', {
        detail: { sezione, dati }
    }));
}

/**
 * Resetta il preventivo corrente
 */
export function resetPreventivo() {
    stato.preventivo = creaPreventivoVuoto();
    window.dispatchEvent(new CustomEvent('stato-aggiornato', {
        detail: { sezione: 'reset' }
    }));
}

/**
 * Imposta i dati del listino
 */
export function setListino(chiave, dati) {
    if (chiave.includes('.')) {
        const [parent, child] = chiave.split('.');
        stato.listino[parent][child] = dati;
    } else {
        stato.listino[chiave] = dati;
    }
}

/**
 * Segna il listino come completamente caricato
 */
export function setListinoCaricato() {
    stato.listinoCaricato = true;
}
