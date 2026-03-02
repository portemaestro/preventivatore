/**
 * Script per importare i dati iniziali nel database:
 * - 2 utenti admin (Mauro, Giuseppe)
 * - 337 rivenditori da data/rivenditori_estratti.json
 *
 * Uso: npm run seed-db
 */
require('dotenv').config();

const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');
const { pool } = require('../src/config/database');

const SALT_ROUNDS = 10;

async function creaAdmin() {
    console.log('Creazione utenti admin...');

    const admin = [
        { username: 'mauro', password: 'Metal2025!', ruolo: 'admin' },
        { username: 'giuseppe', password: 'Metal2025!', ruolo: 'admin' }
    ];

    for (const a of admin) {
        // Controlla se esiste già
        const { rows } = await pool.query(
            'SELECT id FROM utenti WHERE username = $1',
            [a.username]
        );

        if (rows.length > 0) {
            console.log(`  Admin "${a.username}" già presente, salto.`);
            continue;
        }

        const hash = await bcrypt.hash(a.password, SALT_ROUNDS);
        await pool.query(
            'INSERT INTO utenti (username, password_hash, ruolo) VALUES ($1, $2, $3)',
            [a.username, hash, a.ruolo]
        );
        console.log(`  Admin "${a.username}" creato.`);
    }
}

async function importaRivenditori() {
    console.log('Importazione rivenditori...');

    const percorso = path.join(__dirname, '..', 'data', 'rivenditori_estratti.json');
    const contenuto = fs.readFileSync(percorso, 'utf-8');
    const rivenditori = JSON.parse(contenuto);

    // Conta esistenti
    const { rows: [{ count }] } = await pool.query('SELECT COUNT(*) as count FROM rivenditori');
    if (parseInt(count) > 0) {
        console.log(`  ${count} rivenditori già presenti nel DB. Salto importazione.`);
        console.log('  Per reimportare, svuota prima la tabella rivenditori.');
        return;
    }

    let importati = 0;
    let errori = 0;

    for (const r of rivenditori) {
        try {
            await pool.query(
                `INSERT INTO rivenditori
                 (ragione_sociale, rif, indirizzo, cap, citta, provincia, piva,
                  agenzia, pagamento_default, sconto_default)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
                [
                    r.ragione_sociale || r.nome || 'N/D',
                    r.rif || r.riferimento || null,
                    r.indirizzo || null,
                    r.cap || null,
                    r.citta || null,
                    r.provincia || null,
                    r.piva || r.partita_iva || null,
                    r.agenzia || null,
                    r.pagamento || r.pagamento_default || null,
                    r.sconto || r.sconto_default || null
                ]
            );
            importati++;
        } catch (err) {
            errori++;
            if (errori <= 5) {
                console.error(`  Errore importando "${r.ragione_sociale || r.nome}":`, err.message);
            }
        }
    }

    console.log(`  Importati: ${importati}/${rivenditori.length} rivenditori`);
    if (errori > 0) {
        console.log(`  Errori: ${errori}`);
    }
}

async function seed() {
    console.log('=== Seed Database Preventivatore ===\n');

    try {
        await creaAdmin();
        console.log('');
        await importaRivenditori();
        console.log('\n=== Seed completato! ===');
    } catch (err) {
        console.error('Errore durante il seed:', err.message);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

seed();
