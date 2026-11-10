import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const root = path.dirname(fileURLToPath(import.meta.url));
try {
    const env = await readFile(path.join(root, '.env'), 'utf8');
    for (const line of env.split(String.fromCharCode(10))) {
        const match = line.trim().match(/^([A-Z_]+)=(.*)$/);
        if (match && !process.env[match[1]])
            process.env[match[1]] = match[2].trim();
    }
}
catch { }
const port = Number(process.env.PORT || 5173), host = process.env.HOST || '127.0.0.1';
const target = new URL(process.env.API_TARGET || 'http://127.0.0.1:8080');
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.svg': 'image/svg+xml' };
const server = http.createServer(async (req, res) => {
    try {
        const url = new URL(req.url, 'http://localhost');
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
        if (url.pathname.startsWith('/api/')) {
            const headers = {};
            for (const name of ['authorization', 'content-type'])
                if (req.headers[name])
                    headers[name] = req.headers[name];
            let body;
            if (!['GET', 'HEAD'].includes(req.method)) {
                let size = 0;
                const chunks = [];
                for await (const chunk of req) {
                    size += chunk.length;
                    if (size > 6 * 1024 * 1024) {
                        res.writeHead(413, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ message: 'La solicitud supera 6 MB.' }));
                        return;
                    }
                    chunks.push(chunk);
                }
                body = Buffer.concat(chunks);
            }
            try {
                const upstream = await fetch(new URL(url.pathname + url.search, target), { method: req.method, headers, body, signal: AbortSignal.timeout(35000) });
                res.statusCode = upstream.status;
                for (const name of ['content-type', 'cache-control'])
                    if (upstream.headers.has(name))
                        res.setHeader(name, upstream.headers.get(name));
                res.end(Buffer.from(await upstream.arrayBuffer()));
            }
            catch {
                res.writeHead(503, { 'Content-Type': 'application/json; charset=utf-8' });
                res.end(JSON.stringify({ message: 'No se pudo conectar con Spring Boot. Inicia el backend en el puerto 8080 y vuelve a intentar.' }));
            }
            return;
        }
        if (!['GET', 'HEAD'].includes(req.method)) {
            res.writeHead(405);
            res.end();
            return;
        }
        const pathname = decodeURIComponent(url.pathname === '/' ? '/index.html' : url.pathname);
        if (!(/^\/(index\.html|styles\.css|favicon\.svg)$/.test(pathname) || /^\/src\/[a-zA-Z0-9/_-]+\.js$/.test(pathname))) {
            res.writeHead(404);
            res.end('No encontrado');
            return;
        }
        const filename = path.resolve(root, '.' + pathname);
        if (!filename.startsWith(root + path.sep)) {
            res.writeHead(403);
            res.end();
            return;
        }
        const file = await readFile(filename);
        res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' blob: data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'");
        res.writeHead(200, { 'Content-Type': types[path.extname(filename)] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
        res.end(req.method === 'HEAD' ? undefined : file);
    }
    catch {
        res.writeHead(404);
        res.end('No encontrado');
    }
});
server.listen(port, host, () => console.log(`TrabajaYA: http://localhost:${port}
API: ${target.origin}
Ctrl+C para salir.`));
