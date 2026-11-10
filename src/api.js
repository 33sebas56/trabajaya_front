const KEY = 'trabajaya.session';
let token = sessionStorage.getItem(KEY) || '';
const blobs = new Map();
export const session = { get token() { return token; }, set(value) { token = value || ''; if (token)
        sessionStorage.setItem(KEY, token);
    else
        sessionStorage.removeItem(KEY); }, clear() { this.set(''); for (const url of blobs.values())
        URL.revokeObjectURL(url); blobs.clear(); } };
export async function api(path, { method = 'GET', body, signal } = {}) {
    const headers = {};
    if (token)
        headers.Authorization = `Bearer ${token}`;
    if (body !== undefined && !(body instanceof FormData)) {
        headers['Content-Type'] = 'application/json';
        body = JSON.stringify(body);
    }
    let response;
    try {
        response = await fetch('/api' + path, { method, headers, body, signal, cache: 'no-store' });
    }
    catch (error) {
        if (error.name === 'AbortError')
            throw error;
        throw new Error('No pudimos conectar. Revisa tu conexión y vuelve a intentarlo.');
    }
    const type = response.headers.get('content-type') || '';
    const result = type.includes('json') ? await response.json() : null;
    if (!response.ok) {
        const error = new Error(response.status >= 500 ? 'El servicio no está disponible en este momento. Vuelve a intentarlo.' : result?.message || `No se pudo completar la solicitud (${response.status}).`);
        error.status = response.status;
        error.fields = result?.fields;
        throw error;
    }
    return result;
}
export async function upload(file) { const form = new FormData(); form.append('file', file); return api('/media', { method: 'POST', body: form }); }
export async function mediaUrl(id) { if (blobs.has(id))
    return blobs.get(id); const response = await fetch('/api/media/' + encodeURIComponent(id), { headers: { Authorization: `Bearer ${token}` } }); if (!response.ok)
    throw new Error('Imagen no disponible'); const url = URL.createObjectURL(await response.blob()); blobs.set(id, url); return url; }
export async function images(root = document) { for (const img of root.querySelectorAll('[data-media]')) {
    const id = img.dataset.media;
    delete img.dataset.media;
    try {
        img.src = await mediaUrl(id);
    }
    catch {
        img.alt = 'Imagen no disponible';
        img.classList.add('unavailable');
    }
} }
