export const state = { user: null, categories: [], health: null };
export const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const money = v => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(Number(v || 0));
export const date = v => v ? new Intl.DateTimeFormat('es-CO', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(v)) : 'Sin fecha';
export const shortDate = v => new Intl.DateTimeFormat('es-CO', { day: 'numeric', month: 'short' }).format(new Date(v));
export const initials = v => String(v || 'TY').split(' ').filter(Boolean).slice(0, 2).map(x => x[0]).join('');
export const statusNames = { PUBLICADO: 'Buscando talento', ASIGNADO: 'Cupos completos', EN_CURSO: 'En marcha', POR_CONFIRMAR: 'Por confirmar', COMPLETADO: 'Completado', CANCELADO: 'Cancelado', VENCIDO: 'Vencido', ACEPTADO: 'Aceptado', EN_CAMINO: 'En camino', EN_LUGAR: 'En el lugar', INICIADO: 'En ejecución', TERMINADO: 'Terminado', CONFIRMADO: 'Confirmado', ABIERTO: 'Abierto', EN_REVISION: 'En revisión', RESUELTO: 'Resuelto' };
export const badge = s => `<span class="badge ${['COMPLETADO', 'CONFIRMADO'].includes(s) ? 'green' : ['CANCELADO', 'VENCIDO'].includes(s) ? 'muted' : ['PUBLICADO', 'ACEPTADO'].includes(s) ? 'amber' : 'sage'}">${esc(statusNames[s] || s)}</span>`;
const paths = { arrow: 'M5 12h14m-6-6 6 6-6 6', back: 'M19 12H5m6-6-6 6 6 6', search: 'm21 21-5-5M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16', home: 'm3 10 9-7 9 7v11h-6v-7H9v7H3z', briefcase: 'M8 6V4h8v2M3 7h18v13H3zM3 12c6 4 12 4 18 0m-10 0h2', plus: 'M12 5v14M5 12h14', chat: 'M21 11a9 9 0 0 1-9 9H4l-3 2 1-7a9 9 0 1 1 19-4M7 10h10m-10 4h6', user: 'M20 21v-3a6 6 0 0 0-6-6h-4a6 6 0 0 0-6 6v3m12-16a4 4 0 1 1-8 0 4 4 0 0 1 8 0', bell: 'M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9m-12 9h12m-8 4h4', pin: 'M20 9c0 6-8 13-8 13S4 15 4 9a8 8 0 0 1 16 0M15 9a3 3 0 1 1-6 0 3 3 0 0 1 6 0', clock: 'M12 7v5l3 2m6-2a9 9 0 1 1-18 0 9 9 0 0 1 18 0', check: 'm4 12 5 5L20 6', chevron: 'm9 5 7 7-7 7', logout: 'M9 21H3V3h6m5 4 5 5-5 5m-7-5h12', filter: 'M4 7h16M7 12h10m-7 5h4', tool: 'm14 5 5 5m-9 0 10 10M5 14l-3 6 2 2 6-3M14 5a6 6 0 0 0-8 8l-4 4 5 5 4-5a6 6 0 0 0 8-8l-4 2-3-3 2-3z', shield: 'M12 2 3 6v6c0 6 9 10 9 10s9-4 9-10V6zm-5 10 3 3 7-7', star: 'm12 3 3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1z', image: 'M3 3h18v18H3zm0 14 6-6 4 4 3-3 5 5M16 7h.01', close: 'm6 6 12 12M6 18 18 6', send: 'm22 2-7 20-4-9-9-4 20-7ZM11 13 22 2', trend: 'm3 17 6-6 4 4 8-10m-6 0h6v6', grid: 'M3 3h7v7H3zm11 0h7v7h-7zM3 14h7v7H3zm11 0h7v7h-7z', flag: 'M4 22V3m0 1c7-6 9 6 16 0v10c-7 6-9-6-16 0', people: 'M16 21v-3a5 5 0 0 0-5-5H7a5 5 0 0 0-5 5v3m11-16a4 4 0 1 1-8 0 4 4 0 0 1 8 0m9 16v-3a5 5 0 0 0-3-4m-2-13a4 4 0 0 1 0 8', menu: 'M4 6h16M4 12h16M4 18h16', leaf: 'M20 3C7 2 1 10 7 17s15-1 13-14ZM5 21 16 9', eye: 'M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12m13 0a3 3 0 1 1-6 0 3 3 0 0 1 6 0', refresh: 'M20 7a9 9 0 1 0 1 9M20 3v5h-5' };
export function icon(name, cls = '') { return `<svg class="icon ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${paths[name] || paths.briefcase}"/></svg>`; }
export const logo = () => `<a class="brand" href="#/" aria-label="TrabajaYA, inicio"><svg width="35" height="35" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect x="2" y="2" width="60" height="60" rx="19" fill="#c75d3d"/><path d="M17 20h31v8H37v22h-9V28H17z" fill="#fff8e8"/><path d="m44 37 4 4 8-9" fill="none" stroke="#f1d880" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/></svg><span>trabaja<span class="brand-accent">YA</span><small>Hagamos que pase.</small></span></a>`;
export function toast(message, type = 'success') { const el = document.createElement('div'); el.className = 'toast ' + type; el.innerHTML = icon(type === 'success' ? 'check' : 'flag') + `<span>${esc(message)}</span>`; document.querySelector('#toasts').append(el); setTimeout(() => el.remove(), 6500); }
export function errorBox(error) { const fields = error.fields ? '<ul>' + Object.entries(error.fields).map(([field, msg]) => `<li>${esc(field)}: ${esc(msg)}</li>`).join('') + '</ul>' : ''; return `<div class="alert error" role="alert">${esc(error.message)}${fields}</div>`; }
export function empty(title, text, action = '') { return `<div class="empty">${icon('briefcase')}<h3>${esc(title)}</h3><p>${esc(text)}</p>${action}</div>`; }
export function loading() { return '<div class="loading"><span class="spinner"></span> Preparando tu espacio...</div>'; }
export function formValues(form) { return Object.fromEntries(new FormData(form)); }
export async function submit(form, fn) { const button = form.querySelector('[type=submit]'); const original = button?.innerHTML; form.querySelector('.form-errors')?.replaceChildren(); if (button) {
    button.disabled = true;
    button.textContent = form.dataset.pendingLabel || 'Guardando...';
} try {
    await fn();
}
catch (e) {
    const área = form.querySelector('.form-errors');
    if (área) {
        área.innerHTML = errorBox(e);
        área.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
    else
        toast(e.message, 'error');
}
finally {
    if (button?.isConnected) {
        button.disabled = false;
        button.innerHTML = original;
    }
} }
export function modal(title, content, onSubmit) { const el = document.querySelector('#modal'); el.innerHTML = `<form id="modal-form"><div class="modal-heading"><h2>${esc(title)}</h2><button type="button" class="icon-button" data-close aria-label="Cerrar">${icon('close')}</button></div><div class="form-errors"></div>${content}</form>`; el.querySelector('[data-close]').onclick = () => el.close(); el.querySelector('form').onsubmit = event => { event.preventDefault(); submit(event.target, async () => { await onSubmit(formValues(event.target), event.target); el.close(); }); }; el.showModal(); return el; }
export const actions = (text = 'Guardar') => `<div class="form-actions"><button type="submit" class="btn primary">${esc(text)} ${icon('arrow')}</button></div>`;
export function localDateTime(value) { const d = new Date(value); return new Date(d - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16); }
export function skillsBox(selected = []) { return `<div class="skill-options">${state.categories.map(c => `<label class="skill"><input type="checkbox" name="skills" value="${c.id}" ${selected.includes(c.id) ? 'checked' : ''}><span>${esc(c.name)}</span></label>`).join('')}</div>`; }
export function categoryOptions(selected = '') { return '<option value="">Selecciona una categoría</option>' + state.categories.map(c => `<option value="${c.id}" ${String(c.id) === String(selected) ? 'selected' : ''}>${esc(c.name)}</option>`).join(''); }
export function navigate(path) { if (location.hash === '#' + path)
    window.dispatchEvent(new HashChangeEvent('hashchange'));
else
    location.hash = path; }
