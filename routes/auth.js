const express = require("express"); //sirve para crear rutas
const router = express.Router(); //sirve para crear rutas
const admin = require("../firebase"); //importamos firebase admin
const pool = require("../db"); //importamos la conexion a la base de datos

// POST /auth/saveUser
router.post("/saveUser",async(req,res) =>{
    try{
        const {token,nombre,correo,uid } = req.body; //obtenemos el token del cuerpo de la solicitud y el nombre y correo
        
        // 1 verificar token con firebase 
        const decoded = await admin.auth().verifyIdToken(token);//verificamos el token con firebase

        //2 Guardar o actulizar usuario en la base de datos
        const [rows] = await pool.query("SELECT * FROM usuarios WHERE uid = ?", [uid]); //buscamos el usuario por uid

        if(rows.length === 0){
            await pool.query(
                "INSERT INTO usuarios (uid,nombre,correo,racha_dias,ultima_sesion) VALUES (?,?,?,?,?)", 
                [uid,nombre,correo,1,new Date()]);
        }else{
            await pool.query(
                "UPDATE usuarios SET nombre = ?, correo = ? WHERE uid = ?",
                [nombre,correo,uid]
            );
        }

        res.json({ ok: true, message: "Usuario guardado o actualizado correctamente"});

    }catch(error){
        console.error("Error en /auth/saveUser:", error);
        res.status(401).json({ok:false,message: "Token no valido"});
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

router.get("/daily/:uid", async (req, res) => {
  const { uid } = req.params;

  try {
    const [rows] = await pool.query(
      "SELECT ultima_pregunta_diaria FROM usuarios WHERE uid = ?",
      [uid]
    );

    if (rows.length === 0) {
      // nunca ha hecho una → disponible
      return res.json({ available: true });
    }

    const ultima = rows[0].ultima_pregunta_diaria;

    if (!ultima) {
      return res.json({ available: true });
    }

    const now = new Date();
    const last = new Date(ultima);
    const diffMs = now.getTime() - last.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);

    if (diffHours >= 24) {
      return res.json({ available: true });
    }

    const remainingMs = 24 * 60 * 60 * 1000 - diffMs;
    const nextAvailableAt = new Date(now.getTime() + remainingMs).toISOString();

    return res.json({
      available: false,
      remainingMs,
      nextAvailableAt
    });

  } catch (error) {
    console.error("Error en /auth/daily:", error);
    res
      .status(500)
      .json({ ok: false, message: "Error al verificar pregunta diaria" });
  }
});



router.post("/daily/complete", async (req, res) => {
  try {
    const { uid, preguntaId } = req.body;

    await pool.query(`
      UPDATE usuarios
      SET ultima_pregunta_diaria = NOW()
      WHERE uid = ?
    `, [uid]);

    res.json({ ok: true });

  } catch (error) {
    console.error("Error en /daily/complete:", error);
    res.status(500).json({ error: "Error al marcar pregunta diaria" });
  }
});


module.exports = router;