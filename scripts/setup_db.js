/**
 * Script per creare le tabelle del database PostgreSQL.
 * Uso: npm run setup-db
 */
require('dotenv').config();

const { pool } = require('../src/config/database');

const SQL_CREA_TABELLE = `
-- Tabella utenti (admin + rivenditori)
CREATE TABLE IF NOT EXISTS utenti (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    ruolo VARCHAR(20) NOT NULL CHECK (ruolo IN ('admin', 'rivenditore')),
    attivo BOOLEAN DEFAULT true,
    creato_il TIMESTAMP DEFAULT NOW()
);

-- Tabella rivenditori (anagrafica B2B)
CREATE TABLE IF NOT EXISTS rivenditori (
    id SERIAL PRIMARY KEY,
    utente_id INTEGER REFERENCES utenti(id),
    ragione_sociale VARCHAR(255) NOT NULL,
    rif VARCHAR(100),
    indirizzo VARCHAR(255),
    cap VARCHAR(10),
    citta VARCHAR(100),
    provincia VARCHAR(5),
    piva VARCHAR(20),
    agenzia VARCHAR(100),
    pagamento_default VARCHAR(255),
    sconto_default VARCHAR(50),
    logo_url VARCHAR(500),
    creato_il TIMESTAMP DEFAULT NOW()
);

-- Sequenza numerazione preventivi
CREATE SEQUENCE IF NOT EXISTS preventivo_numero_seq START WITH 8000;

-- Tabella preventivi
CREATE TABLE IF NOT EXISTS preventivi (
    id SERIAL PRIMARY KEY,
    numero INTEGER UNIQUE NOT NULL DEFAULT nextval('preventivo_numero_seq'),
    rivenditore_id INTEGER REFERENCES rivenditori(id),
    stato VARCHAR(20) DEFAULT 'bozza' CHECK (stato IN ('bozza', 'preventivo', 'ordine')),
    data_creazione TIMESTAMP DEFAULT NOW(),
    data_modifica TIMESTAMP DEFAULT NOW(),
    agenzia VARCHAR(100),
    responsabile VARCHAR(100) DEFAULT 'GIUSEPPE',
    pagamento VARCHAR(255),
    destinazione TEXT,
    sconto VARCHAR(50),
    totale_materiali DECIMAL(10,2) DEFAULT 0,
    netto_materiali DECIMAL(10,2) DEFAULT 0,
    totale_non_scontabile DECIMAL(10,2) DEFAULT 0,
    imballo DECIMAL(10,2) DEFAULT 0,
    trasporto DECIMAL(10,2) DEFAULT 0,
    imponibile DECIMAL(10,2) DEFAULT 0,
    iva DECIMAL(10,2) DEFAULT 0,
    totale DECIMAL(10,2) DEFAULT 0,
    mezzo_trasporto VARCHAR(50),
    giorni_evasione INTEGER DEFAULT 45,
    note TEXT,
    proposte_speciali TEXT,
    creato_da INTEGER REFERENCES utenti(id)
);

-- Tabella posizioni del preventivo (righe)
CREATE TABLE IF NOT EXISTS posizioni (
    id SERIAL PRIMARY KEY,
    preventivo_id INTEGER REFERENCES preventivi(id) ON DELETE CASCADE,
    numero_posizione INTEGER NOT NULL,
    tipo VARCHAR(50) NOT NULL,
    descrizione TEXT NOT NULL,
    dettaglio JSONB,
    quantita INTEGER DEFAULT 1,
    prezzo_unitario DECIMAL(10,2) NOT NULL,
    sconto_posizione VARCHAR(50),
    netto DECIMAL(10,2),
    totale DECIMAL(10,2),
    scontabile BOOLEAN DEFAULT true,
    ordinamento INTEGER DEFAULT 0
);

-- Tabella listino JSON (JSONB in PostgreSQL)
CREATE TABLE IF NOT EXISTS listino_json (
    sezione VARCHAR(100) PRIMARY KEY,
    dati JSONB NOT NULL,
    aggiornato_il TIMESTAMP DEFAULT NOW()
);

-- Tabella backup listino
CREATE TABLE IF NOT EXISTS listino_backup (
    id SERIAL PRIMARY KEY,
    sezione VARCHAR(100) NOT NULL,
    dati JSONB NOT NULL,
    creato_il TIMESTAMP DEFAULT NOW()
);

-- Indici
CREATE INDEX IF NOT EXISTS idx_preventivi_rivenditore ON preventivi(rivenditore_id);
CREATE INDEX IF NOT EXISTS idx_preventivi_stato ON preventivi(stato);
CREATE INDEX IF NOT EXISTS idx_preventivi_numero ON preventivi(numero);
CREATE INDEX IF NOT EXISTS idx_posizioni_preventivo ON posizioni(preventivo_id);
CREATE INDEX IF NOT EXISTS idx_rivenditori_utente ON rivenditori(utente_id);
CREATE INDEX IF NOT EXISTS idx_listino_backup_sezione ON listino_backup(sezione, creato_il DESC);
`;

async function setup() {
    console.log('Creazione tabelle database...');

    try {
        await pool.query(SQL_CREA_TABELLE);
        console.log('Tabelle create con successo!');
        console.log('Tabelle: utenti, rivenditori, preventivi, posizioni');
        console.log('Sequenza: preventivo_numero_seq (partenza da 8000)');
    } catch (err) {
        console.error('Errore creazione tabelle:', err.message);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

setup();
