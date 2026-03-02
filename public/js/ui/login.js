// Componente pagina login
import { login } from '../auth.js';

export function renderLogin(container) {
    container.innerHTML = `
        <div class="row justify-content-center align-items-center min-vh-100">
            <div class="col-11 col-sm-8 col-md-6 col-lg-4 col-xl-3">
                <div class="card shadow-sm border-0">
                    <div class="card-body p-4">
                        <div class="text-center mb-4">
                            <h3 class="fw-bold text-primary mb-1">
                                <i class="bi bi-shield-lock"></i> Maestro Blindati
                            </h3>
                            <p class="text-muted small">Preventivatore</p>
                        </div>
                        <form id="form-login">
                            <div class="mb-3">
                                <label for="username" class="form-label">Username</label>
                                <input type="text" class="form-control" id="username"
                                       autocomplete="username" required autofocus>
                            </div>
                            <div class="mb-3">
                                <label for="password" class="form-label">Password</label>
                                <div class="input-group">
                                    <input type="password" class="form-control" id="password"
                                           autocomplete="current-password" required>
                                    <button class="btn btn-outline-secondary" type="button" id="btn-mostra-pwd">
                                        <i class="bi bi-eye"></i>
                                    </button>
                                </div>
                            </div>
                            <div id="errore-login" class="alert alert-danger d-none small py-2"></div>
                            <button type="submit" class="btn btn-primary w-100" id="btn-login">
                                Accedi
                            </button>
                        </form>
                    </div>
                    <div class="card-footer text-center bg-transparent border-0 pb-3">
                        <small class="text-muted">Metal 4.0 srls &mdash; Martina Franca (TA)</small>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Event listeners
    const form = document.getElementById('form-login');
    const erroreDiv = document.getElementById('errore-login');
    const btnMostraPwd = document.getElementById('btn-mostra-pwd');
    const inputPwd = document.getElementById('password');

    // Toggle visibilità password
    btnMostraPwd.addEventListener('click', () => {
        const tipo = inputPwd.type === 'password' ? 'text' : 'password';
        inputPwd.type = tipo;
        btnMostraPwd.innerHTML = tipo === 'password'
            ? '<i class="bi bi-eye"></i>'
            : '<i class="bi bi-eye-slash"></i>';
    });

    // Submit login
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        erroreDiv.classList.add('d-none');

        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value;
        const btnLogin = document.getElementById('btn-login');

        if (!username || !password) {
            erroreDiv.textContent = 'Inserisci username e password.';
            erroreDiv.classList.remove('d-none');
            return;
        }

        btnLogin.disabled = true;
        btnLogin.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Accesso...';

        try {
            await login(username, password);
            window.location.hash = '#configuratore';
        } catch (err) {
            erroreDiv.textContent = err.message || 'Errore di accesso.';
            erroreDiv.classList.remove('d-none');
        } finally {
            btnLogin.disabled = false;
            btnLogin.textContent = 'Accedi';
        }
    });
}
