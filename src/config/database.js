const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL?.includes('render.com')
        ? { rejectUnauthorized: false }
        : false
});

pool.on('error', (err) => {
    console.error('Errore connessione PostgreSQL:', err.message);
});

// Verifica connessione
async function testConnessione() {
    try {
        const client = await pool.connect();
        const result = await client.query('SELECT NOW()');
        console.log('PostgreSQL connesso:', result.rows[0].now);
        client.release();
        return true;
    } catch (err) {
        console.error('Impossibile connettersi a PostgreSQL:', err.message);
        return false;
    }
}

module.exports = { pool, testConnessione };
