const db = require('../db');
const { getTemasConSubtemas } = require('../models/temasModel');

// ✅ Obtener todos los temas con sus subtemas
const obtenerTemas = async (req, res) => {
  try {
    const rows = await getTemasConSubtemas();

    const temasMap = {};

    rows.forEach(row => {
      if (!temasMap[row.id_tema]) {
        temasMap[row.id_tema] = {
          id: row.id_tema,
          nombre: row.tema,
          descripcion: row.descripcion,
          icono: row.icono,
          subtemas: []
        };
      }
      if (row.id_subtema) {
        temasMap[row.id_tema].subtemas.push({
          id: row.id_subtema,
          nombre: row.nombre_subtema || row.id_subtema
        });
      }
    });

    res.json(Object.values(temasMap));
  } catch (err) {
    console.error('❌ Error al obtener temas:', err);
    res.status(500).json({ error: 'Error al obtener temas' });
  }
};

// ✅ Agregar un nuevo tema
const agregarTema = async (req, res) => {
  try {
    const { nombre, descripcion, icono } = req.body;
    if (!nombre || !descripcion || !icono) {
      return res.status(400).json({ error: 'Faltan datos del tema' });
    }

    const sql = 'INSERT INTO temas (nombre, descripcion, icono) VALUES (?, ?, ?)';
    const [result] = await db.query(sql, [nombre, descripcion, icono]);

    res.status(201).json({
      id: result.insertId,
      nombre,
      descripcion,
      icono,
      subtemas: []
    });
  } catch (err) {
    console.error('❌ Error al agregar tema:', err);
    res.status(500).json({ error: 'Error al agregar tema' });
  }
};

// ✅ Agregar subtema
const agregarSubtema = async (req, res) => {
  try {
    const { id_tema } = req.params;
    const { nombre } = req.body;

    if (!nombre) {
      return res.status(400).json({ error: 'Falta el nombre del subtema' });
    }

    const sql = 'INSERT INTO subtemas (id_tema, nombre) VALUES (?, ?)';
    const [result] = await db.query(sql, [id_tema, nombre]);

    res.status(201).json({ id: result.insertId, nombre });
  } catch (err) {
    console.error('❌ Error al agregar subtema:', err);
    res.status(500).json({ error: 'Error al agregar subtema' });
  }
};

// ✅ Eliminar tema
const eliminarTema = async (req, res) => {
  try {
    const { id } = req.params;
    const sql = 'DELETE FROM temas WHERE id_tema = ?';
    await db.query(sql, [id]);
    res.json({ success: true });
  } catch (err) {
    console.error('❌ Error al eliminar tema:', err);
    res.status(500).json({ error: 'Error al eliminar tema' });
  }
};

// ✅ Eliminar subtema
const eliminarSubtema = async (req, res) => {
  try {
    const { id_tema, id_subtema } = req.params;
    const sql = 'DELETE FROM subtemas WHERE id_tema = ? AND id_subtema = ?';
    await db.query(sql, [id_tema, id_subtema]);
    res.json({ success: true });
  } catch (err) {
    console.error('❌ Error al eliminar subtema:', err);
    res.status(500).json({ error: 'Error al eliminar subtema' });
  }
};

module.exports = {
  obtenerTemas,
  agregarTema,
  eliminarTema,
  agregarSubtema,
  eliminarSubtema
};
