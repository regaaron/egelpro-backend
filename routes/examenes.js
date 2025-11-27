const express = require("express"); //sirve para crear rutas
const router = express.Router(); //sirve para crear rutas

const pool = require("../db"); //importamos la conexion a la base de datos
const { generateAIQuestions } = require("../services/aiQuestions");


// Utilidad para desordenar un arreglo (Fisher-Yates)
function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// GET /examenes?tema=...&sub=...&n=10 (sub es opcional)
// Devuelve SIEMPRE n preguntas (por defecto 10) relacionadas al tema/sub.
// Si no hay suficientes en BD, completa con preguntas generadas por IA (si hay OPENAI_API_KEY).
router.get('/', async (req, res) => {
  try {
    const { tema, sub } = req.query;
    // Aceptar alias: n o limit
    const rawLimit = (req.query.n ?? req.query.limit);
    const parsedLimit = Number(rawLimit);
    const n = Number.isNaN(parsedLimit) ? 10 : Math.max(1, Math.min(50, parsedLimit));

    // Aceptar alias: ai o ia
    const aiRaw = (req.query.ai ?? req.query.ia ?? '').toString();
    const aiParam = aiRaw.trim().toLowerCase();
    const truthyAI = ['1','true','yes','on','si','sí','con','con ia','con-ia','con_ia'];
    const falsyAI  = ['0','false','no','off','sin','sin ia','sin-ia','sin_ia'];
    const useAI = truthyAI.includes(aiParam) ? true : falsyAI.includes(aiParam) ? false : false;

    if (!tema && !sub) {
      return res.status(400).json({ error: "Faltan parámetros: se requiere 'tema' o 'sub'" });
    }

    // Detectar si se pasan IDs numéricos o nombres
    const temaId = tema && !Number.isNaN(Number(tema)) ? Number(tema) : null;
    const subId = sub && !Number.isNaN(Number(sub)) ? Number(sub) : null;

    // 1) Tomar hasta n preguntas aleatorias desde BD (por tema o subtema)
    let sqlIds;
    let paramsIds;
    if (sub) {
      sqlIds = `
        SELECT p.id_pregunta, p.enunciado
        FROM preguntas p
        JOIN subtemas s ON p.id_subtema = s.id_subtema
        WHERE (s.id_subtema = ? OR s.nombre = ?)
        ORDER BY RAND()
        LIMIT ?
      `;
      paramsIds = [subId ?? -1, sub, n];
    } else {
      sqlIds = `
        SELECT p.id_pregunta, p.enunciado
        FROM preguntas p
        JOIN subtemas s ON p.id_subtema = s.id_subtema
        JOIN temas t ON s.id_tema = t.id_tema
        WHERE (t.id_tema = ? OR t.nombre = ?)
        ORDER BY RAND()
        LIMIT ?
      `;
      paramsIds = [temaId ?? -1, tema, n];
    }

    const [idRows] = await pool.query(sqlIds, paramsIds);
    const pickedIds = idRows.map(r => r.id_pregunta);

    // Si hay preguntas seleccionadas, traer sus respuestas
    let preguntas = [];
    if (pickedIds.length > 0) {
      const placeholders = pickedIds.map(() => '?').join(',');
      const [rows] = await pool.query(
        `SELECT p.id_pregunta, p.enunciado AS pregunta_enunciado, r.id_respuesta, r.texto AS respuesta_texto, r.es_correcta
         FROM preguntas p
         JOIN respuestas r ON r.id_pregunta = p.id_pregunta
         WHERE p.id_pregunta IN (${placeholders})`,
        pickedIds
      );

      const preguntasMap = new Map();
      for (const row of rows) {
        if (!preguntasMap.has(row.id_pregunta)) {
          preguntasMap.set(row.id_pregunta, {
            id_pregunta: row.id_pregunta,
            pregunta_enunciado: row.pregunta_enunciado,
            respuestas: []
          });
        }
        preguntasMap.get(row.id_pregunta).respuestas.push({
          id_respuesta: row.id_respuesta,
          respuesta_texto: row.respuesta_texto,
          es_correcta: Number(row.es_correcta)
        });
      }
      preguntas = Array.from(preguntasMap.values());
    }

    // 2) Si faltan preguntas, completar con IA (solo si el cliente lo pidió)
    const faltantes = n - preguntas.length;
    if (faltantes > 0 && useAI) {
      const aiQs = await generateAIQuestions({ tema, sub, count: faltantes });
      preguntas = preguntas.concat(aiQs);
    }

    // 3) Si aún faltan (sin IA o IA falló), repetir algunas al azar como último recurso
    if (preguntas.length < n && preguntas.length > 0) {
      const needed = n - preguntas.length;
      for (let i = 0; i < needed; i++) {
        preguntas.push({ ...preguntas[i % preguntas.length] });
      }
    }

    // 4) Desordenar preguntas y respuestas, y recortar exactamente n
    preguntas.forEach(p => p.respuestas && shuffle(p.respuestas));
    shuffle(preguntas);
    return res.json(preguntas.slice(0, n));
  } catch (err) {
    console.error('Error en GET /examenes:', err);
    return res.status(500).json({ error: 'Error al obtener preguntas' });
  }
});

// GET /examenes/daily  -> obtener 1 pregunta diaria
router.get('/daily', async (req, res) => {
  try {
    const [preguntas] = await pool.query(`
      SELECT p.id_pregunta, p.enunciado AS pregunta_enunciado
      FROM preguntas p
      ORDER BY RAND()
      LIMIT 1
    `);

    if (preguntas.length === 0) {
      return res.status(404).json({ error: "No hay preguntas" });
    }

    const pregunta = preguntas[0];

    const [respuestas] = await pool.query(
      `
      SELECT id_respuesta, texto AS respuesta_texto, es_correcta
      FROM respuestas
      WHERE id_pregunta = ?
      `,
      [pregunta.id_pregunta]
    );

    pregunta.respuestas = respuestas;

    res.json(pregunta);

  } catch (err) {
    console.error("❌ Error en GET /examenes/daily:", err);
    res.status(500).json({ error: "Error al obtener pregunta diaria" });
  }
});


// (El shuffle ya está definido arriba.)

// http://localhost:3000/examen/:id
// Ruta para obtener un examen específico
router.get('/:id', async (req, res) => { // <-- Usamos async/await
    const idExamen = req.params.id;

    const query = `
        SELECT
            p.id_pregunta,
            p.enunciado AS pregunta_enunciado,
            r.id_respuesta,
            r.texto AS respuesta_texto,
            r.es_correcta
        FROM
            examenes AS e
        JOIN
            examen_preguntas AS ep ON e.id_examen = ep.id_examen
        JOIN
            preguntas AS p ON ep.id_pregunta = p.id_pregunta
        JOIN
            respuestas AS r ON p.id_pregunta = r.id_pregunta
        WHERE
            e.id_examen = ?
        ORDER BY
            p.id_pregunta, r.id_respuesta;
    `;

    try {
        const [results] = await pool.execute(query, [idExamen]); // <-- await y desestructuración

        // Agrupar las respuestas por pregunta
        const examen = {};
        results.forEach(row => {
            if (!examen[row.id_pregunta]) {
                examen[row.id_pregunta] = {
                    id_pregunta: row.id_pregunta,
                    pregunta_enunciado: row.pregunta_enunciado,
                    respuestas: []
                };
            }
            examen[row.id_pregunta].respuestas.push({
                id_respuesta: row.id_respuesta,
                respuesta_texto: row.respuesta_texto
            });
        });

        res.json(Object.values(examen));
    } catch (err) {
        console.error('Error executing query:', err.message);
        res.status(500).json({ error: 'Database query failed.' });
    }
});


module.exports = router;