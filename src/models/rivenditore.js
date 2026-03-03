const { pool } = require('../config/database');

const Rivenditore = {
    async trovaPerId(id) {
        const { rows } = await pool.query(
            `SELECT r.*, u.username
             FROM rivenditori r
             LEFT JOIN utenti u ON r.utente_id = u.id
             WHERE r.id = $1`,
            [id]
        );
        return rows[0] || null;
    },

    async trovaPerUtenteId(utenteId) {
        const { rows } = await pool.query(
            'SELECT * FROM rivenditori WHERE utente_id = $1',
            [utenteId]
        );
        return rows[0] || null;
    },

    async lista(filtri = {}) {
        let query = `SELECT r.*, u.username
                     FROM rivenditori r
                     LEFT JOIN utenti u ON r.utente_id = u.id`;
        const condizioni = [];
        const valori = [];
        let idx = 1;

        if (filtri.agenzia) {
            condizioni.push(`r.agenzia = $${idx}`);
            valori.push(filtri.agenzia);
            idx++;
        }

        if (filtri.cerca) {
            condizioni.push(`(r.ragione_sociale ILIKE $${idx} OR r.citta ILIKE $${idx} OR r.piva ILIKE $${idx})`);
            valori.push(`%${filtri.cerca}%`);
            idx++;
        }

        if (filtri.attivo !== undefined) {
            condizioni.push(`COALESCE(u.attivo, true) = $${idx}`);
            valori.push(filtri.attivo);
            idx++;
        }

        if (condizioni.length > 0) {
            query += ' WHERE ' + condizioni.join(' AND ');
        }

        query += ' ORDER BY r.ragione_sociale';

        // Paginazione
        if (filtri.per_pagina) {
            const offset = ((filtri.pagina || 1) - 1) * filtri.per_pagina;
            query += ` LIMIT $${idx} OFFSET $${idx + 1}`;
            valori.push(filtri.per_pagina, offset);
        }

        const { rows } = await pool.query(query, valori);
        return rows;
    },

    async contaConFiltri(filtri = {}) {
        let query = `SELECT COUNT(*) as totale
                     FROM rivenditori r
                     LEFT JOIN utenti u ON r.utente_id = u.id`;
        const condizioni = [];
        const valori = [];
        let idx = 1;

        if (filtri.agenzia) {
            condizioni.push(`r.agenzia = $${idx}`);
            valori.push(filtri.agenzia);
            idx++;
        }

        if (filtri.cerca) {
            condizioni.push(`(r.ragione_sociale ILIKE $${idx} OR r.citta ILIKE $${idx} OR r.piva ILIKE $${idx})`);
            valori.push(`%${filtri.cerca}%`);
            idx++;
        }

        if (filtri.attivo !== undefined) {
            condizioni.push(`COALESCE(u.attivo, true) = $${idx}`);
            valori.push(filtri.attivo);
            idx++;
        }

        if (condizioni.length > 0) {
            query += ' WHERE ' + condizioni.join(' AND ');
        }

        const { rows } = await pool.query(query, valori);
        return parseInt(rows[0].totale);
    },

    async crea(dati) {
        const { rows } = await pool.query(
            `INSERT INTO rivenditori
             (utente_id, ragione_sociale, rif, indirizzo, cap, citta, provincia, piva,
              agenzia, pagamento_default, sconto_default, logo_url)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
             RETURNING *`,
            [
                dati.utente_id || null,
                dati.ragione_sociale,
                dati.rif || null,
                dati.indirizzo || null,
                dati.cap || null,
                dati.citta || null,
                dati.provincia || null,
                dati.piva || null,
                dati.agenzia || null,
                dati.pagamento_default || null,
                dati.sconto_default || null,
                dati.logo_url || null
            ]
        );
        return rows[0];
    },

    async aggiorna(id, dati) {
        const campiPermessi = [
            'ragione_sociale', 'rif', 'indirizzo', 'cap', 'citta', 'provincia',
            'piva', 'agenzia', 'pagamento_default', 'sconto_default', 'logo_url', 'utente_id'
        ];

        const setClauses = [];
        const valori = [];
        let idx = 1;

        for (const campo of campiPermessi) {
            if (dati[campo] !== undefined) {
                setClauses.push(`${campo} = $${idx}`);
                valori.push(dati[campo]);
                idx++;
            }
        }

        if (setClauses.length === 0) return this.trovaPerId(id);

        valori.push(id);
        const { rows } = await pool.query(
            `UPDATE rivenditori SET ${setClauses.join(', ')} WHERE id = $${idx} RETURNING *`,
            valori
        );
        return rows[0] || null;
    },

    async contaTotale() {
        const { rows } = await pool.query('SELECT COUNT(*) as totale FROM rivenditori');
        return parseInt(rows[0].totale);
    },

    async listaAgenzie() {
        const { rows } = await pool.query(
            `SELECT DISTINCT agenzia FROM rivenditori WHERE agenzia IS NOT NULL ORDER BY agenzia`
        );
        return rows.map(r => r.agenzia);
    }
};

module.exports = Rivenditore;
