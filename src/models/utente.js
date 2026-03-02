const { pool } = require('../config/database');

const Utente = {
    async trovaPerId(id) {
        const { rows } = await pool.query(
            'SELECT id, username, ruolo, attivo, creato_il FROM utenti WHERE id = $1',
            [id]
        );
        return rows[0] || null;
    },

    async trovaPerUsername(username) {
        const { rows } = await pool.query(
            'SELECT * FROM utenti WHERE username = $1',
            [username]
        );
        return rows[0] || null;
    },

    async crea(username, passwordHash, ruolo) {
        const { rows } = await pool.query(
            `INSERT INTO utenti (username, password_hash, ruolo)
             VALUES ($1, $2, $3) RETURNING id, username, ruolo, attivo, creato_il`,
            [username, passwordHash, ruolo]
        );
        return rows[0];
    },

    async aggiorna(id, campi) {
        const setClauses = [];
        const valori = [];
        let idx = 1;

        for (const [chiave, valore] of Object.entries(campi)) {
            setClauses.push(`${chiave} = $${idx}`);
            valori.push(valore);
            idx++;
        }

        valori.push(id);
        const { rows } = await pool.query(
            `UPDATE utenti SET ${setClauses.join(', ')} WHERE id = $${idx}
             RETURNING id, username, ruolo, attivo, creato_il`,
            valori
        );
        return rows[0] || null;
    },

    async lista() {
        const { rows } = await pool.query(
            'SELECT id, username, ruolo, attivo, creato_il FROM utenti ORDER BY id'
        );
        return rows;
    }
};

module.exports = Utente;
