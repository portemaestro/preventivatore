// Navbar Bootstrap con info utente e logout
import { getUtente, logout, isAdmin } from '../auth.js';

export function renderNavbar() {
    const container = document.getElementById('navbar-container');
    const utente = getUtente();
    if (!utente) {
        container.innerHTML = '';
        return;
    }

    const ruoloBadge = isAdmin()
        ? '<span class="badge bg-warning text-dark ms-2">Admin</span>'
        : '<span class="badge bg-info ms-2">Rivenditore</span>';

    container.innerHTML = `
        <nav class="navbar navbar-expand-md navbar-dark shadow-sm">
            <div class="container-fluid">
                <a class="navbar-brand" href="#configuratore">
                    <i class="bi bi-shield-lock me-1"></i> Maestro Blindati
                </a>
                <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarMain">
                    <span class="navbar-toggler-icon"></span>
                </button>
                <div class="collapse navbar-collapse" id="navbarMain">
                    <ul class="navbar-nav me-auto">
                        <li class="nav-item">
                            <a class="nav-link active" href="#configuratore">
                                <i class="bi bi-plus-circle me-1"></i>Nuovo Preventivo
                            </a>
                        </li>
                    </ul>
                    <div class="d-flex align-items-center">
                        <span class="text-light me-3">
                            <i class="bi bi-person-circle me-1"></i>${utente.username}${ruoloBadge}
                        </span>
                        <button class="btn btn-outline-light btn-sm" id="btn-logout">
                            <i class="bi bi-box-arrow-right me-1"></i>Esci
                        </button>
                    </div>
                </div>
            </div>
        </nav>
    `;

    document.getElementById('btn-logout').addEventListener('click', logout);
}
