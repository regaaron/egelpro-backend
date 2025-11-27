router.get("/daily/question", async (req, res) => {
  try {
    // 1) Obtener pregunta
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

    // 2) Obtener respuestas
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

  } catch (error) {
    console.error("Error en GET /daily/question:", error);
    res.status(500).json({ error: "Error al obtener pregunta diaria" });
  }
});
