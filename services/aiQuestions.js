const OpenAI = require('openai');
const config = require('../config'); // ← OPCIONAL si agregas un config central

// Pequeño "circuit breaker" para evitar spamear la API si hay 429 por cuota
let quotaCooldownUntil = 0; // timestamp ms hasta el que no intentaremos llamar a la API

// Crea un cliente de OpenAI si existe la API key; si no, el módulo funciona en modo "no-op"
function getClient() {
  const apiKey =  config.openai.key || process.env.OPENAI_API_KEY;
  const enabledEnv = String(config.openai.enabled || process.env.OPENAI_ENABLED || '1').toLowerCase();
  const enabled = !['0', 'false', 'off', 'no'].includes(enabledEnv);
  if (!enabled) return null;
  if (!apiKey) return null;

  // Configuración mínima: solo API key; el modelo se elige por variable OPENAI_MODEL en la llamada
  const client = new OpenAI({ apiKey });
  return client;
}

// Prompt base (texto) para generar preguntas en JSON estrictamente válido
function buildPromptText({ tema, sub, count }) {
  const scope = sub ? `subtema "${sub}" del tema "${tema ?? ''}"` : `tema "${tema}"`;
  return (
    'Eres un generador de preguntas de opción múltiple para exámenes tipo EGEL en español. ' +
    'Debes devolver únicamente JSON válido que siga exactamente el esquema indicado. ' +
    'No incluyas texto adicional antes o después del JSON.\n\n' +
    `Genera ${count} preguntas de opción múltiple sobre ${scope}. ` +
    'Nivel de dificultad medio. Varía el enfoque para reducir repetición.\n\n' +
    'Devuelve un arreglo JSON con este esquema exacto (sin comentarios):\n' +
    '[\n' +
    '  {\n' +
    '    "pregunta_enunciado": "...",\n' +
    '    "respuestas": [\n' +
    '      { "respuesta_texto": "...", "es_correcta": 1 },\n' +
    '      { "respuesta_texto": "...", "es_correcta": 0 },\n' +
    '      { "respuesta_texto": "...", "es_correcta": 0 },\n' +
    '      { "respuesta_texto": "...", "es_correcta": 0 }\n' +
    '    ]\n' +
    '  }\n' +
    ']\n' +
    'Asegúrate de que cada objeto tenga exactamente una respuesta con es_correcta=1.'
  );
}

// Genera preguntas vía IA. Si no hay API key o hay error, retorna []
async function generateAIQuestions({ tema, sub, count }) {
  const client = getClient();
  if (!client || !count) return [];

  const now = Date.now();
  if (now < quotaCooldownUntil) {
    // Estamos en cooldown por error de cuota previo; evitar nuevos intentos por un tiempo
    return [];
  }

  try {
    const input = buildPromptText({ tema, sub, count });

    // Usar Responses API como en el test mínimo
    const completion = await client.responses.create({
      model: config.openai.model || process.env.OPENAI_MODEL || 'gpt-4o-mini',
      input,
      temperature: 0.7,
      store: false
    });

    const text = completion.output_text?.trim();
    if (!text) return [];

    // Intentar parsear el JSON
    let data;
    try {
      // Si viene con bloque de código ```json, lo limpiamos
      const cleaned = text.replace(/^```json\n?|```$/g, '').trim();
      data = JSON.parse(cleaned);
    } catch (e) {
      return [];
    }

    // Normalizar al shape del backend
    const ts = Date.now();
    const aiQuestions = (Array.isArray(data) ? data : []).map((q, idx) => {
      const qid = `ai-q-${ts}-${idx}`;
      const respuestas = Array.isArray(q.respuestas) ? q.respuestas : [];
      return {
        id_pregunta: qid,
        pregunta_enunciado: String(q.pregunta_enunciado || '').slice(0, 1000),
        respuestas: respuestas.slice(0, 8).map((r, j) => ({
          id_respuesta: `ai-r-${ts}-${idx}-${j}`,
          respuesta_texto: String(r.respuesta_texto || '').slice(0, 1000),
          es_correcta: r.es_correcta ? 1 : 0
        }))
      };
    });

    // Filtrar preguntas que no tengan al menos 2 respuestas
    return aiQuestions.filter(q => Array.isArray(q.respuestas) && q.respuestas.length >= 2);
  } catch (err) {
    const msg = err?.message || String(err);
    const status = err?.status || err?.statusCode;
    if (status === 429 || /quota/i.test(msg)) {
      // 429 de cuota: activamos cooldown (por ejemplo, 1 hora)
      quotaCooldownUntil = Date.now() + 60 * 60 * 1000;
      console.warn('AI generation skipped due to quota; entering cooldown for 1h');
    } else {
      console.warn('AI generation error:', msg);
    }
    return [];
  }
}

module.exports = { generateAIQuestions };
