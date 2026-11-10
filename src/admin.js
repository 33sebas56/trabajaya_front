import { api } from './api.js';
import { state, icon, esc, money, date, badge, empty, toast, modal, actions, loading } from './ui.js';
export async function adminPage({ target, active }) {
    if (state.user.role !== 'ADMIN') {
        target.innerHTML = empty('Acceso restringido', 'Está seccion es para administradores.');
        return;
    }
    const stats = await api('/admin/summary');
    if (!active())
        return;
    target.innerHTML = `<div class="page-heading"><div><div class="eyebrow">CUIDAMOS Está COMUNIDAD</div><h1>Centro de administración.</h1><p>Gestión de usuarios, publicaciones, categorías y casos.</p></div><span class="badge sage">Acceso administrativo</span></div><div class="stats-grid four"><article><span>Usuarios</span><strong>${stats.users}</strong></article><article><span>Trabajos publicados</span><strong>${stats.jobs}</strong></article><article><span>Completados</span><strong>${stats.completed}</strong></article><article><span>Reportes pendientes</span><strong>${stats.reports}</strong></article></div><div class="tabs" id="admin-tabs">${[['users', 'Usuarios'], ['jobs', 'Trabajos'], ['reports', 'Reportes'], ['categories', 'Categorías'], ['audit', 'Auditoría']].map(([id, label], i) => `<button data-tab="${id}" class="${i === 0 ? 'active' : ''}">${label}</button>`).join('')}</div><section id="admin-content" class="panel">${loading()}</section>`;
    let selected = 'users', page = 0, req = 0;
    async function load(tab = selected) {
        selected = tab;
        const current = ++req;
        const box = target.querySelector('#admin-content');
        box.innerHTML = loading();
        target.querySelectorAll('[data-tab]').forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
        try {
            const rows = await api('/admin/' + tab + '?page=' + page);
            if (!active() || current !== req)
                return;
            const table = (head, body) => `<div class="table-scroll"><table><thead><tr>${head.map(h => `<th>${h}</th>`).join('')}</tr></thead><tbody>${body || '<tr><td colspan="8">No hay registros.</td></tr>'}</tbody></table></div>`;
            if (tab === 'users')
                box.innerHTML = table(['Usuario', 'Rol', 'Ciudad', 'Estado', 'Accion'], rows.map(u => `<tr><td><strong>${esc(u.name)}</strong><small>${esc(u.email)}</small></td><td>${esc(u.role)}</td><td>${esc(u.city)}</td><td><span class="badge ${u.active ? 'sage' : 'muted'}">${u.active ? 'Activo' : 'Suspendido'}</span></td><td>${u.role !== 'ADMIN' ? `<button class="btn small secondary" data-user="${u.id}" data-active="${!u.active}">${u.active ? 'Suspender' : 'Reactivar'}</button>` : 'Cuenta administrativa'}</td></tr>`).join(''));
            if (tab === 'jobs')
                box.innerHTML = table(['Trabajo', 'Cliente', 'Oferta', 'Estado', 'Accion'], rows.map(j => `<tr><td><a href="#/trabajo/${j.id}"><strong>${esc(j.title)}</strong></a><small>${esc(j.city)} &middot; #${j.id}</small></td><td>${esc(j.client_name)}</td><td>${money(j.current_price)}</td><td>${badge(j.status)}${j.hidden ? '<small>Suspendido</small>' : ''}</td><td>${j.hidden ? 'Moderado' : `<button class="btn small secondary" data-hide="${j.id}">Suspender publicación</button>`}</td></tr>`).join(''));
            if (tab === 'reports')
                box.innerHTML = rows.map(r => `<article class="admin-case"><div class="row-between"><h3>Caso #${r.id} &middot; ${esc(r.reason)}</h3>${badge(r.status)}</div><p><strong>${esc(r.job_title)}</strong> &middot; ${esc(r.author_name)}</p><p class="description-block">${esc(r.detail)}</p>${r.resolution ? `<div class="resolution">${esc(r.resolution)}</div>` : ''}<div class="row-between"><small>${date(r.created_at)}</small><button class="btn small forest" data-resolve="${r.id}">Gestionar caso ${icon('arrow')}</button></div></article>`).join('') || empty('Sin reportes pendientes', 'Aquí apareceran los casos enviados por los usuarios.');
            if (tab === 'categories')
                box.innerHTML = '<div class="row-between"><h2>Catalogo de oficios</h2><button id="add-category" class="btn forest">' + icon('plus') + ' Nueva categoría</button></div>' + table(['Categoría', 'Estado', 'Accion'], rows.map(c => `<tr><td>${esc(c.name)}</td><td>${c.active ? 'Activa' : 'Inactiva'}</td><td><button class="btn secondary small" data-category="${c.id}">Editar</button></td></tr>`).join(''));
            if (tab === 'audit')
                box.innerHTML = table(['Evento', 'Detalle', 'Responsable', 'Fecha'], rows.map(e => `<tr><td><strong>${esc(e.kind)}</strong><small>${esc(e.title)}</small></td><td>${esc(e.detail)}</td><td>${esc(e.actor_name) || 'Sistema'}</td><td>${date(e.created_at)}</td></tr>`).join(''));
            if (['users', 'jobs', 'audit'].includes(tab)) {
                box.insertAdjacentHTML('beforeend', `<div class="pagination"><button id="prev-admin" class="btn secondary small" ${page === 0 ? 'disabled' : ''}>Anterior</button><span>Página ${page + 1} &middot; Hasta 100 registros</span><button id="next-admin" class="btn secondary small" ${rows.length < 100 ? 'disabled' : ''}>Siguiente</button></div>`);
                box.querySelector('#prev-admin').onclick = () => { page--; load(); };
                box.querySelector('#next-admin').onclick = () => { page++; load(); };
            }
            box.querySelectorAll('[data-user]').forEach(b => b.onclick = () => modal('Actualizar estado de cuenta', `<label>Motivo<textarea name="reason" required minlength="5" maxlength="1000" rows="3"></textarea></label><p class="hint">Una suspensión invalida las sesiones de la cuenta. El historial se conserva.</p>${actions('Guardar decisión')}`, async (d) => { await api('/admin/users/' + b.dataset.user, { method: 'PATCH', body: { active: b.dataset.active === 'true', reason: d.reason } }); toast('Estado actualizado.'); load(); }));
            box.querySelectorAll('[data-hide]').forEach(b => b.onclick = () => modal('Suspender una publicación', `<p>Se ocultara de las oportunidades y se detendran los aumentos y nuevos avances. Los participantes conservaran acceso al historial para reportar el caso.</p><label>Motivo<textarea name="reason" required minlength="5" maxlength="1000" rows="3"></textarea></label>${actions('Suspender publicación')}`, async (d) => { await api('/admin/jobs/' + b.dataset.hide + '/hide', { method: 'POST', body: { active: false, reason: d.reason } }); toast('Publicación suspendida.'); load(); }));
            box.querySelectorAll('[data-resolve]').forEach(b => b.onclick = () => modal('Gestionar caso #' + b.dataset.resolve, `<label>Estado<select name="status"><option value="EN_REVISION">En revisión</option><option value="RESUELTO">Resuelto</option></select></label><label>Respuesta<textarea name="resolution" required minlength="5" maxlength="2500" rows="4"></textarea></label>${actions('Guardar respuesta')}`, async (d) => { await api('/admin/reports/' + b.dataset.resolve, { method: 'PATCH', body: d }); toast('Caso actualizado.'); load(); }));
            function categoryModal(c) { modal(c ? 'Editar categoría' : 'Nueva categoría', `<label>Nombre<input name="name" required maxlength="80" value="${esc(c?.name)}"></label><label class="checkbox"><input type="checkbox" name="active" ${!c || c.active ? 'checked' : ''}><span>Categoría activa</span></label>${actions('Guardar categoría')}`, async (d) => { await api('/admin/categories' + (c ? '/' + c.id : ''), { method: c ? 'PUT' : 'POST', body: { name: d.name, active: !!d.active } }); state.categories = await api('/categories'); toast('Catalogo actualizado.'); load(); }); }
            box.querySelector('#add-category')?.addEventListener('click', () => categoryModal(null));
            box.querySelectorAll('[data-category]').forEach(b => b.onclick = () => categoryModal(rows.find(c => String(c.id) === b.dataset.category)));
        }
        catch (e) {
            box.innerHTML = `<div class="alert error">${esc(e.message)}</div>`;
        }
    }
    target.querySelectorAll('[data-tab]').forEach(b => b.onclick = () => { page = 0; load(b.dataset.tab); });
    await load();
}
