import { returnPath } from './routing.js';
import { api, session, upload, images } from './api.js';
import { state, logo, icon, esc, money, date, initials, toast, errorBox, empty, submit, formValues, skillsBox, actions, navigate } from './ui.js';
function authLayout(title, subtitle, body) {
    return `<div class="auth-page">
      <aside class="auth-art">${logo()}<div><span class="eyebrow">HAGAMOS QUE PASE</span>
        <h1>Las mejores<br>conexiones<br>empiezan<br>con una <em>mano.</em></h1>
        <p>Un lugar para lo que necesitas.<br>Una oportunidad para lo que sabes hacer.</p>
      </div><span class="auth-art-symbol">${icon('briefcase')}</span><small>TrabajaYA &middot; Trabajo independiente</small></aside>
      <main id="main" class="auth-main"><a class="text-link" href="#/">${icon('back')} Volver al inicio</a>
        <div class="auth-form-wrap"><h2>${title}</h2><p>${subtitle}</p>${body}</div>
        <small class="auth-footer">${icon('shield')} Cuida tu cuenta. No compartas tu contraseña. <a href="#/ayuda">Ayuda</a></small>
      </main></div>`;
}
export async function authPage({ target, query, active = () => true }, register = false) {
    if (register && !state.categories.length) {
        try { state.categories = await api('/categories'); } catch { /* Retry can be requested below. */ }
        if (!active()) return;
    }
    let role = query.get('role') === 'TRABAJADOR' ? 'TRABAJADOR' : 'CLIENTE';
    const body = `<form id="auth-form" data-pending-label="${register ? 'Creando tu cuenta...' : 'Ingresando...'}">
      <div class="form-errors" aria-live="polite"></div>
      ${register ? `<fieldset class="role-fieldset"><legend>¿Cómo vas a usar TrabajaYA?</legend><div class="role-switch">
        <label><input type="radio" name="role" value="CLIENTE" ${role === 'CLIENTE' ? 'checked' : ''}><span>${icon('home')} Necesito contratar</span></label>
        <label><input type="radio" name="role" value="TRABAJADOR" ${role === 'TRABAJADOR' ? 'checked' : ''}><span>${icon('briefcase')} Quiero trabajar</span></label>
      </div></fieldset><label>Nombre completo<input name="name" required maxlength="100" autocomplete="name" placeholder="Tu nombre y apellido"></label>` : ''}
      <label>Correo electrónico<input name="email" type="email" required maxlength="180" autocomplete="${register ? 'email' : 'username'}" autocapitalize="none" spellcheck="false" placeholder="tu@correo.com"></label>
      <label>Contraseña<div class="password-input"><input id="password" name="password" type="password" required ${register ? 'minlength="8" maxlength="72"' : ''} autocomplete="${register ? 'new-password' : 'current-password'}" placeholder="${register ? 'Mínimo 8 caracteres, letras y números' : 'Tu contraseña'}"><button type="button" id="show-password" aria-label="Mostrar contraseña" aria-pressed="false">${icon('eye')}</button></div></label>
      ${register ? `<label>Confirmar contraseña<input name="passwordConfirmation" type="password" required minlength="8" maxlength="72" autocomplete="new-password" placeholder="Repite tu contraseña"></label>
        <div class="form-grid two"><label>Celular<input name="phone" type="tel" required maxlength="30" autocomplete="tel" placeholder="Tu número de contacto"></label><label>Ciudad<input name="city" required maxlength="80" placeholder="Tu ciudad" autocomplete="address-level2"></label></div>
        <div id="worker-fields" ${role === 'TRABAJADOR' ? '' : 'hidden'}><h3>Tus habilidades</h3><p class="hint">Selecciona al menos una para encontrar oportunidades compatibles.</p>
          <div id="skills-area">${state.categories.length ? skillsBox() : '<div class="alert">No pudimos cargar las habilidades. <button type="button" class="text-link" id="retry-skills">Volver a intentar</button></div>'}</div>
          <div class="form-grid two"><label>Años de experiencia<input name="experience" type="number" min="0" max="60" value="0"></label><label>Radio de trabajo (km)<input name="radiusKm" type="number" min="1" max="100" value="15"></label></div>
        </div>
        <label class="checkbox"><input type="checkbox" name="terms" required><span>He leído la <a class="text-link" href="#/ayuda" target="_blank" rel="noopener">información de uso</a> y entiendo que los servicios y el pago se acuerdan entre cliente y trabajador.</span></label>`
        : '<a href="#/recuperar" class="text-link forgot-link">Olvidé mi contraseña</a>'}
      <button class="btn primary full" type="submit">${register ? 'Crear mi cuenta' : 'Iniciar sesión'} ${icon('arrow')}</button>
      <p class="auth-switch">${register ? '¿Ya tienes una cuenta? <a href="#/acceso">Inicia sesión</a>' : '¿Todavía no tienes cuenta? <a href="#/registro">Crea tu cuenta</a>'}</p>
    </form>`;
    target.innerHTML = authLayout(register ? 'Tu próxima conexión empieza aquí.' : 'Qué bueno tenerte de vuelta.', register ? 'Crea un perfil según lo que quieres hacer.' : 'Ingresa a tu cuenta para continuar.', body);
    target.querySelector('#show-password').onclick = event => {
        const input = target.querySelector('#password'), show = input.type === 'password';
        input.type = show ? 'text' : 'password';
        event.currentTarget.setAttribute('aria-label', show ? 'Ocultar contraseña' : 'Mostrar contraseña');
        event.currentTarget.setAttribute('aria-pressed', String(show));
    };
    target.querySelectorAll('[name=role]').forEach(input => input.onchange = () => {
        role = input.value; target.querySelector('#worker-fields').hidden = role !== 'TRABAJADOR';
    });
    const retry = target.querySelector('#retry-skills');
    if (retry) retry.onclick = async () => {
        retry.disabled = true;
        try { state.categories = await api('/categories'); if (active()) target.querySelector('#skills-area').innerHTML = skillsBox(); }
        catch (e) { if (active()) toast(e.message, 'error'); }
        finally { if (retry.isConnected) retry.disabled = false; }
    };
    const form = target.querySelector('#auth-form');
    form.onsubmit = event => {
        event.preventDefault();
        submit(form, async () => {
            const data = formValues(form);
            let body = { email: data.email.trim(), password: data.password };
            if (register) {
                if (data.password !== data.passwordConfirmation) throw new Error('Las contraseñas no coinciden.');
                const skills = [...form.querySelectorAll('[name=skills]:checked')].map(input => Number(input.value));
                if (role === 'TRABAJADOR' && !skills.length) throw new Error('Selecciona al menos una habilidad.');
                body = { ...body, name: data.name.trim(), phone: data.phone.trim(), city: data.city.trim(), role,
                    skills: role === 'TRABAJADOR' ? skills : [], experience: Number(data.experience || 0),
                    radiusKm: Number(data.radiusKm || 15), acceptedTerms: !!data.terms };
            }
            const response = await api('/auth/' + (register ? 'register' : 'login'), { method: 'POST', body });
            session.set(response.token); state.user = response.user;
            if (!state.categories.length) {
                try { state.categories = await api('/categories'); } catch { /* The next form can request a retry. */ }
            }
            toast(register ? 'Tu cuenta está lista. Bienvenido a TrabajaYA.' : 'Sesión iniciada.');
            navigate(returnPath(query.get('next'), state.user.role));
        });
    };
}
export async function forgotPage({ target }) {
    target.innerHTML = authLayout('Recupera tu acceso.', 'Solicita un enlace para crear una nueva contraseña.', `<form id="forgot"><div class="form-errors"></div><label>Correo electrónico<input type="email" name="email" required autocomplete="email"></label>${actions('Solicitar enlace')}</form><a href="#/acceso" class="text-link">Volver al inicio de sesión</a>`);
    const form = target.querySelector('#forgot');
    form.onsubmit = e => { e.preventDefault(); submit(form, async () => { const result = await api('/auth/forgot-password', { method: 'POST', body: formValues(form) }); form.innerHTML = `<div class="alert success">${esc(result.message)}</div>`; }); };
}
export async function resetPage({ target, query }) {
    target.innerHTML = authLayout('Una nueva contraseña.', 'El enlace vence en 20 minutos y solo puede usarse una vez.', `<form id="reset"><div class="form-errors"></div><label>Nueva contraseña<input name="password" type="password" required minlength="8" maxlength="72" autocomplete="new-password"></label><p class="hint">Mínimo 8 caracteres, con letras y números.</p>${actions('Actualizar contraseña')}</form>`);
    const form = target.querySelector('#reset');
    form.onsubmit = e => { e.preventDefault(); submit(form, async () => { await api('/auth/reset-password', { method: 'POST', body: { token: query.get('token') || '', password: formValues(form).password } }); session.clear(); state.user = null; toast('Contraseña actualizada. Inicia sesión.'); navigate('/acceso'); }); };
}
export function fullProfileBody(user, changes = {}) { return { name: user.name, phone: user.phone, city: user.city, bio: user.bio || '', experience: user.experience || 0, skills: user.skills || [], radiusKm: user.radius_km || 15, available: user.available, latitude: user.latitude ?? null, longitude: user.longitude ?? null, avatarId: user.avatar_id ?? null, ...changes }; }
export async function profilePage({ target, active }) {
    const u = await api('/me');
    if (!active())
        return;
    state.user = u;
    let lat = u.latitude, lon = u.longitude;
    target.innerHTML = `<div class="page-heading"><div><div class="eyebrow">TU CARTA DE PRESENTACIÓN</div><h1>Mi perfil.</h1><p>Mantén tus datos al día y encuentra conexiones que sí encajan.</p></div></div><div class="profile-layout"><aside class="panel profile-summary"><div class="profile-avatar">${u.avatar_id ? `<img data-media="${esc(u.avatar_id)}" alt="Mi foto de perfil">` : `<span>${esc(initials(u.name))}</span>`}</div><h2>${esc(u.name)}</h2><p>${esc(u.role)} &middot; ${esc(u.city)}</p><div class="reputation-score">${icon('star')}<strong>${u.reputation.average ? Number(u.reputation.average).toFixed(1) : 'Sin opiniones'}</strong><small>${u.reputation.total} calificaciones</small></div><div class="privacy-note">${icon('shield')}<p>Tu identidad y tus habilidades son autodeclaradas. La plataforma no muestra una verificación que no se haya realizado.</p></div></aside><form class="panel profile-form" id="profile-form"><div class="form-errors"></div><h2>Información personal</h2><div class="form-grid two"><label>Nombre completo<input name="name" required maxlength="100" value="${esc(u.name)}"></label><label>Correo<input disabled value="${esc(u.email)}"><small>No se modifica desde el perfil.</small></label><label>Celular<input name="phone" required maxlength="30" value="${esc(u.phone)}"></label><label>Ciudad<input name="city" required maxlength="80" value="${esc(u.city)}"></label></div><label>Sobre ti<textarea name="bio" maxlength="1200" rows="3" placeholder="Cuenta que haces y como trabajas.">${esc(u.bio)}</textarea></label><label>Fotografía de perfil<input type="file" name="avatar" accept="image/png,image/jpeg"><small>PNG o JPEG. Máximo 5 MB.</small></label>${u.role === 'TRABAJADOR' ? `<hr><h2>Tu trabajo, a tu manera</h2>${skillsBox(u.skills)}<div class="form-grid two"><label>Años de experiencia<input name="experience" type="number" min="0" max="60" value="${u.experience}"></label><label>Radio de trabajo (km)<input name="radiusKm" type="number" min="1" max="100" value="${u.radius_km}"></label></div><label class="checkbox availability-switch"><input name="available" type="checkbox" ${u.available ? 'checked' : ''}><span>Estoy disponible para recibir y aceptar trabajos.</span></label>` : ''}<div class="geo-settings"><div><strong>Zona de referencia</strong><p id="geo-message">${lat != null ? 'Ubicación de referencia configurada.' : 'Sin coordenadas: las coincidencias usan tu ciudad.'}</p></div><button class="btn secondary small" type="button" id="use-location">${icon('pin')} Usar mi ubicación</button><button class="text-link" type="button" id="clear-location">Quitar</button></div>${actions('Guardar cambios')}</form></div>`;
    target.querySelector('#use-location').onclick = () => { if (!navigator.geolocation) {
        toast('Este navegador no permite geolocalizacion.', 'error');
        return;
    } navigator.geolocation.getCurrentPosition(p => { lat = p.coords.latitude; lon = p.coords.longitude; target.querySelector('#geo-message').textContent = 'Ubicación obtenida. Guarda el perfil para aplicarla.'; }, () => toast('No fue posible obtener tu ubicación. Puedes continuar usando la ciudad.', 'error'), { timeout: 10000 }); };
    target.querySelector('#clear-location').onclick = () => { lat = null; lon = null; target.querySelector('#geo-message').textContent = 'Se usara solo tu ciudad al guardar.'; };
    const form = target.querySelector('#profile-form');
    form.onsubmit = e => { e.preventDefault(); submit(form, async () => { const d = formValues(form), avatar = form.querySelector('[name=avatar]').files[0]; let avatarId = u.avatar_id; if (avatar)
        avatarId = (await upload(avatar)).id; const body = fullProfileBody(u, { name: d.name, phone: d.phone, city: d.city, bio: d.bio, experience: Number(d.experience ?? u.experience), radiusKm: Number(d.radiusKm ?? u.radius_km), available: u.role === 'TRABAJADOR' ? !!d.available : u.available, skills: u.role === 'TRABAJADOR' ? [...form.querySelectorAll('[name=skills]:checked')].map(x => Number(x.value)) : [], latitude: lat ?? null, longitude: lon ?? null, avatarId: avatarId ?? null }); state.user = await api('/me', { method: 'PUT', body }); toast('Perfil actualizado.'); navigate('/perfil'); }); };
}
export async function publicProfile({ target, active }, id) {
    const u = await api('/users/' + id);
    if (!active())
        return;
    target.innerHTML = `<a class="text-link" href="#/trabajos">${icon('back')} Volver a mis trabajos</a><div class="panel public-profile"><div class="profile-avatar">${u.avatar_id ? `<img data-media="${esc(u.avatar_id)}" alt="Foto del perfil">` : esc(initials(u.name))}</div><div><div class="eyebrow">PERFIL DE LA COMUNIDAD</div><h1>${esc(u.name)}</h1><p>${esc(u.city)} &middot; ${esc(u.role)}</p><p>${esc(u.bio) || 'Está persona aún no ha agregado una presentacion.'}</p><div class="skill-labels">${u.skills.map(s => `<span>${esc(state.categories.find(c => c.id === s)?.name || 'Oficio')}</span>`).join('')}</div></div><div class="reputation-score">${icon('star')}<strong>${u.reputation.average ? Number(u.reputation.average).toFixed(1) : '--'}</strong><small>${u.reputation.total} opiniones</small></div></div><h2>Experiencias compartidas</h2><div class="report-grid">${u.reviews.map(r => `<article class="panel"><div class="row-between"><strong>${esc(r.author_name)}</strong><span>${r.score}/5 ${icon('star')}</span></div><p>${esc(r.comment) || 'Sin comentario escrito.'}</p><small>${date(r.created_at)}</small></article>`).join('') || empty('Aún no hay opiniones', 'Las calificaciones aparecen después de completar un trabajo.')}</div>`;
}
