const express = require("express"); //sirve para crear rutas
const router = express.Router(); //sirve para crear rutas

const pool = require("../db"); //importamos la conexion a la base de datos


router.get("/preguntas", async (req,res) =>{
    try{
        const [rows] = await pool.query(`
        SELECT id_pregunta, enunciado 
        FROM preguntas
        ORDER BY id_pregunta ASC`);

        res.json(rows);
    }catch(error){
        console.error("Error en /admin/preguntas:", error);
        res.status(500).json({ok:false,message: "Error al obtener preguntas"});
    }
});

// Obtener pregunta por ID y sus opciones
router.get("/preguntas/:id", async (req,res) =>{
    const {id} = req.params;
    try{
        const [pregunta] = await pool.query(`
            select * from preguntas where id_pregunta = ?`, [id]);
        
    if(pregunta.length === 0){
        return  res.status(404).json({ok:false, message: "Pregunta no encontrada"});
    }
    //obtener opciones
    const [respuestas] = await pool.query(`
        select * from respuestas where id_pregunta = ?`, [id]);
    

    res.json({pregunta: pregunta[0], respuestas});
    }catch(error){
        console.error("Error en /admin/preguntas/:id:", error);
        res.status(500).json({ok:false,message: "Error al obtener la pregunta"});
    }
});

//actualizar pregunta y sus opciones
router.put("/preguntas/:id", async (req,res) =>{
    const {id} = req.params;
    const {enunciado,dificultad,respuestas} = req.body;
try {
        // Actualizar pregunta
        await pool.query(
            `UPDATE preguntas
             SET enunciado = ?, dificultad = ?
             WHERE id_pregunta = ?`,
            [enunciado, dificultad, id]
        );

        // Actualizar respuestas
        for (const resp of respuestas) {
            await pool.query(
                `UPDATE respuestas
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
router.delete("/preguntas/:id", async (req,res) =>{
    const {id} = req.params;

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        // Verificar si existe la pregunta
        const [pregunta] = await connection.query(
            `SELECT * FROM preguntas WHERE id_pregunta = ?`,
            [id]
        );

        if (pregunta.length === 0) {
            await connection.release();
            return res.status(404).json({ ok: false, message: "Pregunta no encontrada" });
        }

        // Eliminar respuestas primero
        await connection.query(
            `DELETE FROM respuestas WHERE id_pregunta = ?`,
            [id]
        );

        // Eliminar la pregunta
        await connection.query(
            `DELETE FROM preguntas WHERE id_pregunta = ?`,
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


module.exports = router;