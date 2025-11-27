const express = require("express"); //sirve para crear rutas
const router = express.Router(); //sirve para crear rutas
const admin = require("../firebase"); //importamos firebase admin
const pool = require("../db"); //importamos la conexion a la base de datos
// POST /auth/saveUser
router.post("/saveUser", async (req, res) => {
    try {
        const { nombre, correo, uid } = req.body;

        // Validación básica
        if (!uid || !nombre || !correo) {
            return res.status(400).json({
                ok: false,
                message: "Faltan datos obligatorios (uid, nombre, correo)"
            });
        }

        // Verificar si el usuario ya existe
        const [rows] = await pool.query(
            "SELECT * FROM usuarios WHERE uid = ?",
            [uid]
        );

        if (rows.length === 0) {
            // Crear usuario nuevo
            await pool.query(
                `INSERT INTO usuarios (uid, nombre, correo, racha_dias, ultima_sesion)
                 VALUES (?, ?, ?, ?, ?)`,
                [uid, nombre, correo, 1, new Date()]
            );
        } else {
            // Actualizar si ya existe
            await pool.query(
                `UPDATE usuarios 
                 SET nombre = ?, correo = ?
                 WHERE uid = ?`,
                [nombre, correo, uid]
            );
        }

        res.json({
            ok: true,
            message: "Usuario guardado o actualizado correctamente"
        });

    } catch (error) {
        console.error("Error en /auth/saveUser:", error);
        res.status(500).json({
            ok: false,
            message: "Error interno del servidor"
        });
    }
});

// obtener todos los usuarios ruta http://localhost:3000/auth/users
router.get("/users",async(req,res)=> {
    try{
        const [rows] = await pool.query(" SELECT * FROM usuarios");
        res.json(rows);
    }catch(error){
        console.error("Error en /auth/users:", error);
        res.status(500).json({ok:false,message: "Error al obtener usuarios"});

    }
});

// actualizar racha de un usuario
// ruta http://localhost:3000/auth/updateStreak
// metodo post
// body: { uid: "uid del usuario" }
router.post("/updateStreak", async (req, res) => {
  try {
    const { uid } = req.body;

    const [rows] = await pool.query(
      "SELECT racha_dias, ultima_sesion FROM usuarios WHERE uid = ?",
      [uid]
    );

    const user = rows[0];
    if (!user) return res.status(404).json({ message: "Usuario no encontrado" });

    const hoy = new Date().toISOString().split("T")[0];
    const ultimaSesion = user.ultima_sesion
      ? new Date(user.ultima_sesion).toISOString().split("T")[0]
      : null;

    let nuevaRacha = 1;

    if (ultimaSesion) {
      const diffDias = Math.floor(
        (new Date(hoy) - new Date(ultimaSesion)) / (1000 * 60 * 60 * 24)
      );

      if (diffDias === 1) {
        nuevaRacha = user.racha_dias + 1;
      } else if (diffDias === 0) {
        nuevaRacha = user.racha_dias;
      } else {
        nuevaRacha = 1;
      }
    }

    await pool.query(
      "UPDATE usuarios SET racha_dias = ?, ultima_sesion = ? WHERE uid = ?",
      [nuevaRacha, hoy, uid]
    );

    console.log("Racha actualizada a:", nuevaRacha);
    res.json({ ok: true, racha: nuevaRacha });
  } catch (error) {
    console.error("Error en /auth/updateStreak:", error);
    res.status(500).json({ ok: false, message: "Error al actualizar racha" });
  }
});

//obtener la racha de un usuario
router.get("/racha/:uid",async(req,res)=>{
    const { uid } = req.params;

    try{
        const [rows] = await pool.query("SELECT racha_dias FROM usuarios WHERE uid = ?",[uid]);

         if(rows.length > 0){
            console.log("Racha: ", rows[0].racha_dias) 
            res.json({ racha: rows[0].racha_dias });
             
        } else {
            res.json({ racha: 0 });
        }

    }catch(error){
        console.error("Error en /auth/racha:", error);
        res.status(500).json({ok:false,message: "Error al obtener racha"});
    }
})


module.exports = router;