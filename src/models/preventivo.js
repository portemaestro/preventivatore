const { pool } = require('../config/database');

const Preventivo = {
    async trovaPerId(id) {
        const { rows } = await pool.query(
            `SELECT p.*, r.ragione_sociale, r.rif, r.citta
             FROM preventivi p
             LEFT JOIN rivenditori r ON p.rivenditore_id = r.id
             WHERE p.id = $1`,
            [id]
        );
        return rows[0] || null;
    },

    async trovaPerNumero(numero) {
        const { rows } = await pool.query(
            `SELECT p.*, r.ragione_sociale, r.rif, r.citta
             FROM preventivi p
             LEFT JOIN rivenditori r ON p.rivenditore_id = r.id
             WHERE p.numero = $1`,
            [numero]
        );
        return rows[0] || null;
    },

    async lista(filtri = {}) {
        let query = `SELECT p.id, p.numero, p.stato, p.data_creazione, p.data_modifica,
                            p.totale, p.sconto, p.agenzia,
                            r.ragione_sociale, r.citta
                     FROM preventivi p
                     LEFT JOIN rivenditori r ON p.rivenditore_id = r.id`;
        const condizioni = [];
        const valori = [];
        let idx = 1;

        if (filtri.rivenditore_id) {
            condizioni.push(`p.rivenditore_id = $${idx}`);
            valori.push(filtri.rivenditore_id);
            idx++;
        }

        if (filtri.stato) {
            condizioni.push(`p.stato = $${idx}`);
            valori.push(filtri.stato);
            idx++;
        }

        if (filtri.agenzia) {
            condizioni.push(`p.agenzia = $${idx}`);
            valori.push(filtri.agenzia);
            idx++;
        }

        if (filtri.cerca) {
            condizioni.push(`(p.numero::text ILIKE $${idx} OR r.ragione_sociale ILIKE $${idx})`);
            valori.push(`%${filtri.cerca}%`);
            idx++;
        }

        if (filtri.data_da) {
            condizioni.push(`p.data_creazione >= $${idx}`);
            valori.push(filtri.data_da);
            idx++;
        }

        if (filtri.data_a) {
            condizioni.push(`p.data_creazione < ($${idx}::date + interval '1 day')`);
            valori.push(filtri.data_a);
            idx++;
        }

        if (condizioni.length > 0) {
            query += ' WHERE ' + condizioni.join(' AND ');
        }

        query += ' ORDER BY p.numero DESC';

        if (filtri.per_pagina) {
            const offset = ((filtri.pagina || 1) - 1) * filtri.per_pagina;
            query += ` LIMIT $${idx} OFFSET $${idx + 1}`;
            valori.push(filtri.per_pagina, offset);
        } else if (filtri.limite) {
            query += ` LIMIT $${idx}`;
            valori.push(filtri.limite);
            idx++;
        }

        const { rows } = await pool.query(query, valori);
        return rows;
    },

    async contaConFiltri(filtri = {}) {
        let query = `SELECT COUNT(*) as totale
                     FROM preventivi p
                     LEFT JOIN rivenditori r ON p.rivenditore_id = r.id`;
        const condizioni = [];
        const valori = [];
        let idx = 1;

        if (filtri.rivenditore_id) {
            condizioni.push(`p.rivenditore_id = $${idx}`);
            valori.push(filtri.rivenditore_id);
            idx++;
        }

        if (filtri.stato) {
            condizioni.push(`p.stato = $${idx}`);
            valori.push(filtri.stato);
            idx++;
        }

        if (filtri.agenzia) {
            condizioni.push(`p.agenzia = $${idx}`);
            valori.push(filtri.agenzia);
            idx++;
        }

        if (filtri.cerca) {
            condizioni.push(`(p.numero::text ILIKE $${idx} OR r.ragione_sociale ILIKE $${idx})`);
            valori.push(`%${filtri.cerca}%`);
            idx++;
        }

        if (filtri.data_da) {
            condizioni.push(`p.data_creazione >= $${idx}`);
            valori.push(filtri.data_da);
            idx++;
        }

        if (filtri.data_a) {
            condizioni.push(`p.data_creazione < ($${idx}::date + interval '1 day')`);
            valori.push(filtri.data_a);
            idx++;
        }

        if (condizioni.length > 0) {
            query += ' WHERE ' + condizioni.join(' AND ');
        }

        const { rows } = await pool.query(query, valori);
        return parseInt(rows[0].totale);
    },

    async crea(dati) {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            const { rows: [{ nextval }] } = await client.query(
                "SELECT nextval('preventivo_numero_seq')"
            );
            const numero = parseInt(nextval);

            const { rows } = await client.query(
                `INSERT INTO preventivi
                 (numero, rivenditore_id, stato, agenzia, responsabile, pagamento,
                  destinazione, sconto, mezzo_trasporto, giorni_evasione, note,
                  proposte_speciali, creato_da)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
                 RETURNING *`,
                [
                    numero,
                    dati.rivenditore_id,
                    'bozza',
                    dati.agenzia || null,
                    dati.responsabile || 'GIUSEPPE',
                    dati.pagamento || null,
                    dati.destinazione || null,
                    dati.sconto || null,
                    dati.mezzo_trasporto || null,
                    dati.giorni_evasione || 45,
                    dati.note || null,
                    dati.proposte_speciali || null,
                    dati.creato_da
                ]
            );

            await client.query('COMMIT');
            return rows[0];
        } catch (err) {
            await client.query('ROLLBACK');
            throw err;
        } finally {
            client.release();
        }
    },

    async aggiorna(id, dati) {
        const campiPermessi = [
            'rivenditore_id', 'agenzia', 'responsabile', 'pagamento', 'destinazione',
            'sconto', 'totale_materiali', 'netto_materiali', 'totale_non_scontabile',
            'imballo', 'trasporto', 'imponibile', 'iva', 'totale',
            'mezzo_trasporto', 'giorni_evasione', 'note', 'proposte_speciali'
        ];

        const setClauses = ['data_modifica = NOW()'];
        const valori = [];
        let idx = 1;

        for (const campo of campiPermessi) {
            if (dati[campo] !== undefined) {
                setClauses.push(`${campo} = $${idx}`);
                valori.push(dati[campo]);
                idx++;
            }
        }

        valori.push(id);
        const { rows } = await pool.query(
            `UPDATE preventivi SET ${setClauses.join(', ')} WHERE id = $${idx} RETURNING *`,
            valori
        );
        return rows[0] || null;
    },

    async cambiaStato(id, nuovoStato) {
        const { rows } = await pool.query(
            `UPDATE preventivi SET stato = $1, data_modifica = NOW()
             WHERE id = $2 RETURNING *`,
            [nuovoStato, id]
        );
        return rows[0] || null;
    },

    async elimina(id) {
        await pool.query('DELETE FROM preventivi WHERE id = $1 AND stato = $2', [id, 'bozza']);
    },

    // Statistiche per dashboard admin
    async statistiche() {
        const { rows } = await pool.query(`
            SELECT
                COUNT(*) as totale_preventivi,
                COUNT(*) FILTER (WHERE stato = 'bozza') as bozze,
                COUNT(*) FILTER (WHERE stato = 'preventivo') as preventivi_attivi,
                COUNT(*) FILTER (WHERE stato = 'ordine') as ordini,
                COUNT(*) FILTER (WHERE data_creazione >= date_trunc('month', CURRENT_DATE)) as mese_corrente,
                COALESCE(SUM(totale) FILTER (WHERE stato = 'ordine'), 0) as fatturato_ordini,
                COALESCE(SUM(totale) FILTER (WHERE stato = 'ordine' AND data_creazione >= date_trunc('month', CURRENT_DATE)), 0) as fatturato_mese
            FROM preventivi
        `);
        return rows[0];
    },

    // Posizioni
    async ottieniPosizioni(preventivoId) {
        const { rows } = await pool.query(
            `SELECT * FROM posizioni
             WHERE preventivo_id = $1
             ORDER BY ordinamento, numero_posizione`,
            [preventivoId]
        );
        return rows;
    },

    async aggiungiPosizione(preventivoId, dati) {
        const { rows } = await pool.query(
            `INSERT INTO posizioni
             (preventivo_id, numero_posizione, tipo, descrizione, dettaglio,
              quantita, prezzo_unitario, sconto_posizione, netto, totale, scontabile, ordinamento)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
             RETURNING *`,
            [
                preventivoId,
                dati.numero_posizione,
                dati.tipo,
                dati.descrizione,
                dati.dettaglio ? JSON.stringify(dati.dettaglio) : null,
                dati.quantita || 1,
                dati.prezzo_unitario,
                dati.sconto_posizione || null,
                dati.netto || dati.prezzo_unitario,
                dati.totale || dati.prezzo_unitario * (dati.quantita || 1),
                dati.scontabile !== undefined ? dati.scontabile : true,
                dati.ordinamento || 0
            ]
        );
        return rows[0];
    },

    async aggiornaPosizione(id, dati) {
        const campiPermessi = [
            'numero_posizione', 'tipo', 'descrizione', 'dettaglio',
            'quantita', 'prezzo_unitario', 'sconto_posizione', 'netto',
            'totale', 'scontabile', 'ordinamento'
        ];

        const setClauses = [];
        const valori = [];
        let idx = 1;

        for (const campo of campiPermessi) {
            if (dati[campo] !== undefined) {
                const valore = campo === 'dettaglio' ? JSON.stringify(dati[campo]) : dati[campo];
                setClauses.push(`${campo} = $${idx}`);
                valori.push(valore);
                idx++;
            }
        }

        if (setClauses.length === 0) return null;

        valori.push(id);
        const { rows } = await pool.query(
            `UPDATE posizioni SET ${setClauses.join(', ')} WHERE id = $${idx} RETURNING *`,
            valori
        );
        return rows[0] || null;
    },

    async eliminaPosizione(id) {
        await pool.query('DELETE FROM posizioni WHERE id = $1', [id]);
    },

    async eliminaTuttePosizioni(preventivoId) {
        await pool.query('DELETE FROM posizioni WHERE preventivo_id = $1', [preventivoId]);
    }
};

module.exports = Preventivo;
