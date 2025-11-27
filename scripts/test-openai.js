// Minimal test to verify OpenAI API connectivity and credentials
// Usage: npm run test:openai

require('dotenv').config();
const OpenAI = require('openai');
const config = require('./config'); // ← OPCIONAL si agregas un config central

async function main() {
  const apiKey = config.openai.key || process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.error('ERROR: Falta OPENAI_API_KEY en .env');
    process.exit(1);
  }

  const model = config.openai.model || process.env.OPENAI_MODEL || 'gpt-4o-mini';

  const client = new OpenAI({ apiKey });

  // Try the Responses API (recommended in SDK v4)
  try {
    console.log(`Intentando llamada a OpenAI con modelo: ${model}`);
    const response = await client.responses.create({
      model,
      input: 'Escribe un haiku muy breve sobre IA',
      store: false,
    });
    const text = response.output_text || JSON.stringify(response);
    console.log('\nRespuesta OK:\n');
    console.log(text);
    process.exit(0);
  } catch (err) {
    const status = err?.status || err?.statusCode;
    const code = err?.code || err?.error?.code;
    const message = err?.message || String(err);
    console.error('\nFallo la llamada a OpenAI');
    console.error('status:', status, 'code:', code);
    console.error('message:', message);
    if (status === 429) {
      console.error('\nSugerencia: Puede ser cuota insuficiente o rate limit. Revisa billing/usage o reduce frecuencia.');
    }
    process.exit(2);
  }
}

main();
