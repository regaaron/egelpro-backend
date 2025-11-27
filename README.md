# egelpro-backend

API backend (Express + MySQL) para EGEL Pro con integración opcional de IA (OpenAI) para generar preguntas cuando falten en la BD.

## Endpoints principales

- `GET /examenes?tema=...&sub=...&n=10`
  - Devuelve siempre `n` preguntas (por defecto 10) del tema o subtema, con respuestas.
  - Orden aleatorio; si la BD no alcanza, completa con IA (si está habilitada); si aún faltan, duplica para llegar a `n`.
  - Control de IA por request: agrega `ai=true` para permitir generación con IA. Si no se especifica, usa el valor global `OPENAI_ENABLED`.
- `GET /examenes/:id`
  - Devuelve preguntas + respuestas de un examen específico por id.
- `GET /api/temas`
  - Catálogo de temas y subtemas.

## Integración IA (OpenAI)

La IA es opcional y está controlada por variables de entorno. Si no hay clave o está deshabilitada, el backend sigue funcionando sin IA.

Variables `.env` relevantes (configuración mínima):

- `OPENAI_ENABLED` (opcional): `true|false` (por defecto `true`).
- `OPENAI_API_KEY` (requerida para IA): clave de OpenAI (formato `sk-...`).
- `OPENAI_MODEL` (opcional): modelo a usar, p. ej. `gpt-4o-mini`. Usa uno que tu cuenta tenga habilitado por API.

Parámetro por request:

- `ai`: `true|1|yes|on` para habilitar IA explícitamente en esa llamada; si se omite, se respeta `OPENAI_ENABLED`.

Ejemplo `.env`:

```
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=...
DB_NAME=...
DB_PORT=3306

OPENAI_ENABLED=true
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o-mini
# No se requiere organization ni project para la configuración básica.
```

### Lógica de degradación y cooldown

- Si la IA devuelve `429` por cuota insuficiente (insufficient_quota), el backend activa un cooldown (por defecto 1 hora) para no volver a llamar a OpenAI durante ese periodo.
- Mientras tanto, el endpoint `GET /examenes` sigue respondiendo 10 preguntas sin IA.
- Puedes desactivar IA por completo con `OPENAI_ENABLED=false`.

### Probar la IA de forma aislada

Hay un script de prueba que realiza una llamada mínima a la API de OpenAI para verificar credenciales/uso:

```powershell
npm run test:openai
```

- Usa `OPENAI_API_KEY`, `OPENAI_MODEL` y opcionalmente `OPENAI_ORG`/`OPENAI_PROJECT`.
- Si falla con `429`, revisa uso y billing: https://platform.openai.com/usage y https://platform.openai.com/account/billing/overview
- Si falla con modelo no encontrado, verifica que tu cuenta tenga acceso al modelo elegido.

## Desarrollo

- `npm start`: iniciar servidor Express.
- El pool MySQL usa variables `.env` (`DB_*`).

## Notas

- Si planeas usar Azure OpenAI en lugar de OpenAI, habría que ajustar el cliente en `services/aiQuestions.js` para usar el endpoint y la clave de Azure, además del `deployment` del modelo.
