const express = require("express"); //sirve para crear rutas
const router = express.Router(); //sirve para crear rutas
const admin = require("../firebase"); //importamos firebase admin
const pool = require("../db"); //importamos la conexion a la base de datos


// http://localhost:3000/examen/:id
// Ruta para obtener un examen específico
router.get('/:id', async (req, res) => { // <-- Usamos async/await
    const idExamen = req.params.id;

    const query = `
        SELECT
            p.id_pregunta,
            p.enunciado AS pregunta_enunciado,
            r.id_respuesta,
            r.texto AS respuesta_texto
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