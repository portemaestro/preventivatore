/**
 * Utility per gestire il listino prezzi su PostgreSQL (JSONB).
 * Fallback su file JSON in data/ se la sezione non è ancora in DB.
 */
const fs = require('fs');
const path = require('path');
const { pool } = require('../config/database');

// Mappa sezione -> nome file JSON su disco
const MAPPA_SEZIONI = {
    'blindati': 'blindati.json',
    'telai': 'telai.json',
    'supplementi_fuori_standard': 'supplementi_fuori_standard.json',
    'rivestimenti_laminati': 'rivestimenti_laminati.json',
    'rivestimenti_impiallacciati': 'rivestimenti_impiallacciati.json',
    'rivestimenti_stratificati': 'rivestimenti_stratificati.json',
    'rivestimenti_okoume': 'rivestimenti_okoume.json',
    'rivestimenti_alluminio': 'rivestimenti_alluminio.json',
    'rivestimenti_pvc': 'rivestimenti_pvc.json',
    'sfinestrature_sopraluce_fiancoluce': 'sfinestrature_sopraluce_fiancoluce.json',
    'optional': 'optional.json',
    'serrature_motorizzate': 'serrature_motorizzate.json',
    'maniglioni': 'maniglioni.json',
    'cerniere_scomparsa': 'cerniere_scomparsa.json',
    'trasporto_imballo': 'trasporto_imballo.json'
};

// Nomi leggibili per le sezioni
const NOMI_SEZIONI = {
    'blindati': 'Blindati (prezzi base)',
    'telai': 'Telai',
    'supplementi_fuori_standard': 'Supplementi fuori standard',
    'rivestimenti_laminati': 'Rivestimenti Laminati',
    'rivestimenti_impiallacciati': 'Rivestimenti Impiallacciati',
    'rivestimenti_stratificati': 'Rivestimenti Stratificati',
    'rivestimenti_okoume': 'Rivestimenti Okoumè',
    'rivestimenti_alluminio': 'Rivestimenti Alluminio',
    'rivestimenti_pvc': 'Rivestimenti PVC',
    'sfinestrature_sopraluce_fiancoluce': 'Sfinestrature, Sopraluce, Fiancoluce',
    'optional': 'Optional',
    'serrature_motorizzate': 'Serrature Motorizzate',
    'maniglioni': 'Maniglioni',
    'cerniere_scomparsa': 'Cerniere a scomparsa',
    'trasporto_imballo': 'Trasporto e Imballo'
};

// Raggruppamento per la dashboard
const GRUPPI = {
    'Blindati e Telai': ['blindati', 'telai', 'supplementi_fuori_standard', 'cerniere_scomparsa'],
    'Rivestimenti': ['rivestimenti_laminati', 'rivestimenti_impiallacciati', 'rivestimenti_stratificati',
                     'rivestimenti_okoume', 'rivestimenti_alluminio', 'rivestimenti_pvc'],
    'Accessori e Optional': ['optional', 'serrature_motorizzate', 'maniglioni',
                             'sfinestrature_sopraluce_fiancoluce'],
    'Trasporto': ['trasporto_imballo']
};

const ICONE_GRUPPI = {
    'Blindati e Telai': { icona: 'bi-door-closed', colore: '#1a3a5c' },
    'Rivestimenti': { icona: 'bi-palette', colore: '#6f42c1' },
    'Accessori e Optional': { icona: 'bi-tools', colore: '#198754' },
    'Trasporto': { icona: 'bi-truck', colore: '#e65100' }
};

/**
 * Legge una sezione del listino. Prima cerca in DB, fallback su file JSON.
 * Se trovata su file, la importa automaticamente in DB.
 */
async function leggiSezione(sezione) {
    // Prova dal DB
    const { rows } = await pool.query(
        'SELECT dati, aggiornato_il FROM listino_json WHERE sezione = $1',
        [sezione]
    );

    if (rows.length > 0) {
        return { dati: rows[0].dati, aggiornato_il: rows[0].aggiornato_il, fonte: 'db' };
    }

    // Fallback su file + auto-import
    const nomeFile = MAPPA_SEZIONI[sezione];
    if (!nomeFile) throw new Error(`Sezione "${sezione}" non valida`);

    const percorso = path.join(__dirname, '..', '..', 'data', nomeFile);
    if (!fs.existsSync(percorso)) throw new Error(`File non trovato: ${nomeFile}`);

    const dati = JSON.parse(fs.readFileSync(percorso, 'utf-8'));

    // Auto-import in DB
    try {
        await pool.query(
            `INSERT INTO listino_json (sezione, dati) VALUES ($1, $2)
             ON CONFLICT (sezione) DO NOTHING`,
            [sezione, JSON.stringify(dati)]
        );
    } catch (err) {
        console.warn(`Auto-import sezione ${sezione} fallito:`, err.message);
    }

    return { dati, aggiornato_il: null, fonte: 'file' };
}

/**
 * Scrive una sezione del listino in DB.
 * Crea automaticamente un backup prima della scrittura.
 */
async function scriviSezione(sezione, dati) {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // Backup dei dati attuali (se esistono)
        await client.query(
            `INSERT INTO listino_backup (sezione, dati)
             SELECT sezione, dati FROM listino_json WHERE sezione = $1`,
            [sezione]
        );

        // Upsert
        await client.query(
            `INSERT INTO listino_json (sezione, dati, aggiornato_il)
             VALUES ($1, $2, NOW())
             ON CONFLICT (sezione) DO UPDATE SET dati = $2, aggiornato_il = NOW()`,
            [sezione, JSON.stringify(dati)]
        );

        await client.query('COMMIT');
        return true;
    } catch (err) {
        await client.query('ROLLBACK');
        throw err;
    } finally {
        client.release();
    }
}

/**
 * Lista tutte le sezioni con info metadati.
 */
async function listaSezioni() {
    const { rows } = await pool.query(
        'SELECT sezione, aggiornato_il FROM listino_json ORDER BY sezione'
    );

    const mappaDB = {};
    rows.forEach(r => { mappaDB[r.sezione] = r.aggiornato_il; });

    return Object.entries(MAPPA_SEZIONI).map(([sezione, file]) => ({
        sezione,
        nome: NOMI_SEZIONI[sezione] || sezione,
        file,
        in_db: !!mappaDB[sezione],
        aggiornato_il: mappaDB[sezione] || null
    }));
}

/**
 * Importa una sezione da file JSON in DB.
 */
async function importaDaFile(sezione) {
    const nomeFile = MAPPA_SEZIONI[sezione];
    if (!nomeFile) throw new Error(`Sezione "${sezione}" non valida`);

    const percorso = path.join(__dirname, '..', '..', 'data', nomeFile);
    const dati = JSON.parse(fs.readFileSync(percorso, 'utf-8'));

    await scriviSezione(sezione, dati);
    return dati;
}

/**
 * Ottiene i backup di una sezione.
 */
async function listaBackup(sezione) {
    const { rows } = await pool.query(
        `SELECT id, creato_il FROM listino_backup
         WHERE sezione = $1
         ORDER BY creato_il DESC LIMIT 10`,
        [sezione]
    );
    return rows;
}

/**
 * Ripristina un backup specifico.
 */
async function ripristinaDaBackup(sezione, backupId) {
    const { rows } = await pool.query(
        'SELECT dati FROM listino_backup WHERE id = $1 AND sezione = $2',
        [backupId, sezione]
    );

    if (rows.length === 0) throw new Error('Backup non trovato');

    await scriviSezione(sezione, rows[0].dati);
    return rows[0].dati;
}

module.exports = {
    MAPPA_SEZIONI,
    NOMI_SEZIONI,
    GRUPPI,
    ICONE_GRUPPI,
    leggiSezione,
    scriviSezione,
    listaSezioni,
    importaDaFile,
    listaBackup,
    ripristinaDaBackup
};
