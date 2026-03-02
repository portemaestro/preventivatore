const jwt = require('jsonwebtoken');

// Verifica token JWT
function verificaToken(req, res, next) {
    const header = req.headers['authorization'];
    if (!header) {
        return res.status(401).json({ errore: 'Token mancante' });
    }

    const token = header.startsWith('Bearer ') ? header.slice(7) : header;

    try {
        const payload = jwt.verify(token, process.env.JWT_SECRET);
        req.utente = payload;
        next();
    } catch (err) {
        return res.status(401).json({ errore: 'Token non valido o scaduto' });
    }
}

// Verifica ruolo admin
function soloAdmin(req, res, next) {
    if (req.utente.ruolo !== 'admin') {
        return res.status(403).json({ errore: 'Accesso riservato agli amministratori' });
    }
    next();
}

// Verifica ruolo admin o stesso rivenditore
function adminOProprietario(req, res, next) {
    if (req.utente.ruolo === 'admin') {
        return next();
    }
    // Il rivenditore può accedere solo ai propri dati
    const rivenditoreId = parseInt(req.params.id);
    if (req.utente.rivenditore_id === rivenditoreId) {
        return next();
    }
    return res.status(403).json({ errore: 'Accesso non autorizzato' });
}

module.exports = { verificaToken, soloAdmin, adminOProprietario };
