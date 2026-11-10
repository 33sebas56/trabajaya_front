# Prueba visual offline

Es un doble controlado de API para probar interacciones de interfaz. NO prueba Spring, SQL, seguridad real, Supabase ni concurrencia. El servidor normal `server.mjs` no importa este codigo.

Dependencias de prueba opcionales: Python 3, Playwright con Chromium, TypeScript. No son dependencias de ejecucion del frontend.

```powershell
# Desde la raiz del frontend:
npm install --no-save --package-lock=false typescript
python -m pip install playwright
python -m playwright install chromium
node tests/visual/bundle.cjs
python tests/visual/browser_checks.py
```

Puedes indicar la ruta a Chromium con CHROMIUM_PATH. La prueba carga los modulos y CSS sin hacer navegacion de red; captura imagenes en `artifacts/`. Las solicitudes se resuelven con `MockAPI`, no con el backend.
