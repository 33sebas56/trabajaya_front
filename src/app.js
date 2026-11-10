import { homeFor, allowedPath, titleFor } from './routing.js';
import { helpPage } from './help.js';
import { api, session, images } from './api.js';
import { state, logo, icon, esc, initials, toast, errorBox, loading, navigate } from './ui.js';
import { landing, dashboard, explore, notifications, reports, messages } from './pages.js';
import { authPage, profilePage, publicProfile, forgotPage, resetPage } from './account.js';
import { publishPage, detailPage } from './jobs.js';
import { adminPage } from './admin.js';
let cleanup = () => { }, version = 0;
function shell(content, path) {
    const u = state.user, worker = u.role === 'TRABAJADOR', admin = u.role === 'ADMIN';
    const links = admin ? [['/admin', 'grid', 'Resumen'], ['/avisos', 'bell', 'Notificaciones'], ['/perfil', 'user', 'Mi perfil']] : [['/inicio', 'home', 'Mi inicio'], ...(worker ? [['/explorar', 'search', 'Oportunidades']] : [['/publicar', 'plus', 'Publicar trabajo']]), ['/trabajos', 'briefcase', 'Mis trabajos'], ['/mensajes', 'chat', 'Mensajes'], ['/avisos', 'bell', 'Notificaciones'], ['/perfil', 'user', 'Mi perfil'], ['/reportes', 'flag', 'Mis reportes']];
    const nav = links.map(([href, i, text]) => `<a href="#${href}" class="nav-link ${path === href ? 'active' : ''}">${icon(i)}<span>${text}</span>${href === '/avisos' ? '<b id="unread" class="counter" hidden></b>' : ''}</a>`).join('');
    return `<div class="workspace"><aside class="sidebar">${logo()}<div class="role-tag">${admin ? 'Administración' : worker ? 'ESPACIO TRABAJADOR' : 'ESPACIO CLIENTE'}</div><nav aria-label="Navegación principal">${nav}</nav><div class="sidebar-note">${icon('leaf')}<strong>El talento está cerca.</strong><p>Una buena conexión empieza con una necesidad clara.</p></div><button class="profile-mini" id="logout"><span class="avatar">${esc(initials(u.name))}</span><span><strong>${esc(u.name.split(' ')[0])}</strong><small>Cerrar sesión</small></span>${icon('logout')}</button></aside><div class="workspace-body"><header class="topbar"><div class="mobile-brand">${logo()}</div><div class="breadcrumb">Tu comunidad <span>/</span> <strong>${worker ? 'TrabajaYA Pro' : admin ? 'Administración' : 'TrabajaYA'}</strong></div><div class="top-actions"><a class="text-link desktop-only" href="#/ayuda">Ayuda</a><a href="#/avisos" class="icon-button" aria-label="Notificaciones">${icon('bell')}</a><button class="icon-button mobile-menu" id="menu-toggle" aria-label="Abrir menú">${icon('menu')}</button><a class="avatar small desktop-only" href="#/perfil" aria-label="Mi perfil">${esc(initials(u.name))}</a></div></header><main id="main" class="main-content">${content}</main><footer class="workspace-footer"><span>TrabajaYA &middot; Una oportunidad para cada necesidad.</span><span>Los pagos se acuerdan entre las partes.</span></footer></div><nav class="bottom-nav" aria-label="Navegación móvil">${links.slice(0, 4).map(([href, i, text]) => `<a class="${path === href ? 'active' : ''}" href="#${href}">${icon(i)}<span>${text}</span></a>`).join('')}</nav></div>`;
}
async function route() {
    const current = ++version;
    cleanup();
    cleanup = () => { };
    const parsed = new URL((location.hash.slice(1) || '/'), 'http://localhost');
    const path = parsed.pathname, query = parsed.searchParams;
    const isPublic = ['/', '/acceso', '/registro', '/recuperar', '/restablecer', '/ayuda'].includes(path);
    if (!isPublic && !state.user) {
        navigate('/acceso?next=' + encodeURIComponent(path + parsed.search));
        return;
    }
    if (state.user && ['/acceso', '/registro'].includes(path)) {
        navigate(homeFor(state.user.role)); return;
    }
    if (!isPublic && !allowedPath(path, state.user.role)) {
        toast('Esta opción no está disponible para tu tipo de cuenta.', 'error');
        navigate(homeFor(state.user.role)); return;
    }
    document.title = titleFor(path);
    const app = document.querySelector('#app');
    app.innerHTML = isPublic ? `<div id="page">${loading()}</div>` : shell(loading(), path);
    if (!isPublic) {
        document.querySelector('#logout').onclick = async () => { try {
            await api('/auth/logout', { method: 'POST' });
        }
        catch { } session.clear(); state.user = null; navigate('/'); };
        document.querySelector('#menu-toggle').onclick = () => document.querySelector('.sidebar').classList.toggle('mobile-open');
    }
    const target = isPublic ? document.querySelector('#page') : document.querySelector('#main');
    const context = { target, query, active: () => current === version, onCleanup: fn => { if (current !== version) { fn(); return; } const previous = cleanup; cleanup = () => { previous(); fn(); }; } };
    try {
        if (path === '/')
            await landing(context);
        else if (path === '/acceso' || path === '/registro')
            await authPage(context, path === '/registro');
        else if (path === '/ayuda')
            await helpPage(context);
        else if (path === '/recuperar')
            await forgotPage(context);
        else if (path === '/restablecer')
            await resetPage(context);
        else if (path === '/inicio')
            await dashboard(context);
        else if (path === '/explorar' || path === '/trabajos')
            await explore(context, path === '/trabajos');
        else if (path === '/publicar')
            await publishPage(context);
        else if (/^\/editar\/\d+$/.test(path))
            await publishPage(context, Number(path.split('/')[2]));
        else if (/^\/trabajo\/\d+$/.test(path))
            await detailPage(context, Number(path.split('/')[2]));
        else if (path === '/perfil')
            await profilePage(context);
        else if (/^\/perfil\/\d+$/.test(path))
            await publicProfile(context, Number(path.split('/')[2]));
        else if (path === '/mensajes')
            await messages(context);
        else if (path === '/avisos')
            await notifications(context);
        else if (path === '/reportes')
            await reports(context);
        else if (path === '/admin')
            await adminPage(context);
        else
            target.innerHTML = '<h1>No encontramos esta página.</h1><p>Comprueba el enlace o vuelve a tu inicio.</p><a class="btn secondary" href="#/inicio">Volver al inicio</a>';
        if (current === version) {
            images(target);
            window.scrollTo(0, 0);
        }
    }
    catch (e) {
        if (current === version) {
            if (e.status === 401 && state.user) {
                session.clear(); state.user = null;
                toast('Tu sesión terminó. Inicia sesión para continuar.', 'error');
                navigate('/acceso?next=' + encodeURIComponent(path + parsed.search)); return;
            }
            target.innerHTML = errorBox(e) + `<button id="retry" class="btn secondary">${icon('refresh')} Volver a intentar</button>`;
            target.querySelector('#retry').onclick = route;
        }
    }
}
async function boot() {
    document.querySelector('.skip')?.addEventListener('click', event => {
        event.preventDefault();
        const main = document.querySelector('#main');
        if (main) { main.tabIndex = -1; main.focus(); main.scrollIntoView({ block: 'start' }); }
    });
    document.querySelector('#app').innerHTML = loading();
    try {
        [state.categories, state.health] = await Promise.all([api('/categories'), api('/health')]);
    }
    catch { }
    if (session.token) {
        try {
            state.user = await api('/me');
        }
        catch (e) {
            if (e.status === 401) {
                session.clear();
            }
            else
                toast(e.message, 'error');
        }
    }
    window.addEventListener('hashchange', route);
    await route();
    setInterval(async () => { if (!state.user || document.hidden)
        return; try {
        const result = await api('/notifications');
        const el = document.querySelector('#unread');
        if (el) {
            el.hidden = !result.unread;
            el.textContent = result.unread > 99 ? '99+' : result.unread;
        }
    }
    catch (e) {
        if (e.status === 401) {
            session.clear();
            state.user = null;
            toast('Tu sesión venció o fue cerrada. Vuelve a ingresar.', 'error');
            navigate('/acceso');
        }
    } }, 7000);
}
boot();
