const express = require("express"); //sirve para crear rutas
const router = express.Router(); //sirve para crear rutas
const admin = require("../firebase"); //importamos firebase admin
const pool = require("../db"); //importamos la conexion a la base de datos


router.get("/preguntasai", async (req,res) =>{
    try{
        const [rows] = await pool.query(`
        SELECT id_pregunta, enunciado 
        FROM preguntasAI
        ORDER BY id_pregunta ASC`);

        res.json(rows);
    }catch(error){
        console.error("Error en /admin/preguntas:", error);
        res.status(500).json({ok:false,message: "Error al obtener preguntas"});
    }
});

// Obtener pregunta por ID y sus opciones
router.get("/preguntasai/:id", async (req,res) =>{
    const {id} = req.params;
    try{
        const [pregunta] = await pool.query(`
            select * from preguntasAI where id_pregunta = ?`, [id]);
        
    if(pregunta.length === 0){
        return  res.status(404).json({ok:false, message: "Pregunta no encontrada"});
    }
    //obtener opciones
    const [respuestas] = await pool.query(`
        select * from respuestasAI where id_pregunta = ?`, [id]);
    

    res.json({pregunta: pregunta[0], respuestas});
    }catch(error){
        console.error("Error en /admin/preguntas/:id:", error);
        res.status(500).json({ok:false,message: "Error al obtener la pregunta"});
    }
});

//actualizar pregunta y sus opciones
router.put("/preguntasai/:id", async (req,res) =>{
    const {id} = req.params;
    const {enunciado,dificultad,respuestas} = req.body;
try {
        // Actualizar pregunta
        await pool.query(
            `UPDATE preguntasAI 
             SET enunciado = ?, dificultad = ?
             WHERE id_pregunta = ?`,
            [enunciado, dificultad, id]
        );

        // Actualizar respuestas
        for (const resp of respuestas) {
            await pool.query(
                `UPDATE respuestasAI
                 SET texto = ?, es_correcta = ?
                 WHERE id_respuesta = ?`,
                [resp.texto, resp.es_correcta, resp.id_respuesta]
            );
        }

        res.json({ ok: true, message: "Pregunta y respuestas actualizadas correctamente" });

    } catch (error) {
        console.error("Error en PUT /admin/preguntas/:id:", error);
        res.status(500).json({ ok: false, message: "Error al actualizar" });
    }
    
})


//eliminar pregunta por ID y sus opciones
router.delete("/preguntasai/:id", async (req,res) =>{
    const {id} = req.params;

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        // Verificar si existe la pregunta
        const [pregunta] = await connection.query(
            `SELECT * FROM preguntasAI WHERE id_pregunta = ?`,
            [id]
        );

        if (pregunta.length === 0) {
            await connection.release();
            return res.status(404).json({ ok: false, message: "Pregunta no encontrada" });
        }

        // Eliminar respuestas primero
        await connection.query(
            `DELETE FROM respuestasAI WHERE id_pregunta = ?`,
            [id]
        );

        // Eliminar la pregunta
        await connection.query(
            `DELETE FROM preguntasAI WHERE id_pregunta = ?`,
            [id]
        );

        await connection.commit();
        connection.release();

        res.json({ ok: true, message: "Pregunta y sus respuestas eliminadas correctamente" });

    } catch (error) {
        await connection.rollback();
        connection.release();

        console.error("Error en DELETE /admin/preguntas/:id:", error);
        res.status(500).json({ ok: false, message: "Error al eliminar la pregunta" });
    }
});

// ACEPTAR una pregunta: moverla de AI a DEFINITIVA y luego eliminar de AI
router.post("/preguntasai/aceptar/:id", async (req, res) => {
    const { id } = req.params;

    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        // 1. Obtener la pregunta AI
        const [pregunta] = await connection.query(
            `SELECT * FROM preguntasAI WHERE id_pregunta = ?`,
            [id]
        );

        if (pregunta.length === 0) {
            await connection.release();
            return res.status(404).json({ ok: false, message: "Pregunta no encontrada" });
        }

        const p = pregunta[0];

        // 2. Insertar en la tabla final PREGUNTAS
        const [insertPregunta] = await connection.query(
            `INSERT INTO preguntas (enunciado, dificultad, id_subtema)
            VALUES (?, ?, ?)`,
            [p.enunciado, p.dificultad, p.id_subtema]
        );


        const nuevoId = insertPregunta.insertId; // LAST_INSERT_ID()

        // 3. Obtener respuestas AI
        const [respuestas] = await connection.query(
            `SELECT * FROM respuestasAI WHERE id_pregunta = ?`,
            [id]
        );

        // 4. Insertar respuestas en tabla FINAL
        for (const r of respuestas) {
            await connection.query(
                `INSERT INTO respuestas (id_pregunta, texto, es_correcta)
                 VALUES (?, ?, ?)`,
                [nuevoId, r.texto, r.es_correcta]
            );
        }

        // 🔍 5. REUTILIZAMOS LA LÓGICA DEL ELIMINAR
        // Eliminar respuestas de AI
        await connection.query(
            `DELETE FROM respuestasAI WHERE id_pregunta = ?`,
            [id]
        );

        // Eliminar la pregunta de AI
        await connection.query(
            `DELETE FROM preguntasAI WHERE id_pregunta = ?`,
            [id]
        );

        await connection.commit();
        connection.release();

        res.json({
            ok: true,
            message: "Pregunta aceptada, movida y eliminada de AI correctamente",
            nuevaPreguntaID: nuevoId
        });

    } catch (error) {
        await connection.rollback();
        connection.release();
        console.error("Error en POST /preguntas/aceptar/:id:", error);
        res.status(500).json({ ok: false, message: "Error al aceptar la pregunta" });
    }
});


module.exports = router;