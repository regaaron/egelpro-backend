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
const agregarTema = (req, res) => {
  const { nombre, descripcion, icono } = req.body;

  if (!nombre || !descripcion || !icono) {
    return res.status(400).json({ error: 'Faltan datos del tema' });
  }

  const sql = 'INSERT INTO temas (nombre, descripcion, icono) VALUES (?, ?, ?)';
  db.query(sql, [nombre, descripcion, icono], (err, result) => {
    if (err) {
      console.error('❌ Error al agregar tema:', err);
      return res.status(500).json({ error: 'Error al agregar tema' });
    }

    res.status(201).json({
      id: result.insertId,
      nombre,
      descripcion,
      icono,
      subtemas: []
    });
  });
};



// ✅ Agregar subtema
const agregarSubtema = (req, res) => {
  const { id_tema } = req.params;
  const { nombre } = req.body;

  if (!nombre) {
    return res.status(400).json({ error: 'Falta el nombre del subtema' });
  }

  const sql = 'INSERT INTO subtemas (id_tema, nombre) VALUES (?, ?)';
  db.query(sql, [id_tema, nombre], (err, result) => {
    if (err) {
      console.error('❌ Error al agregar subtema:', err);
      return res.status(500).json({ error: 'Error al agregar subtema' });
    }

    res.status(201).json({ id: result.insertId, nombre });
  });
};

// Eliminar tema
const eliminarTema = (req, res) => {
  const { id } = req.params;
  const sql = 'DELETE FROM temas WHERE id_tema = ?';
  db.query(sql, [id], (err) => {
    if (err) {
      console.error('Error al eliminar tema:', err);
      return res.status(500).json({ error: 'Error al eliminar tema' });
    }
    res.json({ success: true });
  });
};

// Eliminar subtema
const eliminarSubtema = (req, res) => {
  const { id_tema, id_subtema } = req.params;
  const sql = 'DELETE FROM subtemas WHERE id_tema = ? AND id_subtema = ?';
  db.query(sql, [id_tema, id_subtema], (err) => {
    if (err) {
      console.error('Error al eliminar subtema:', err);
      return res.status(500).json({ error: 'Error al eliminar subtema' });
    }
    res.json({ success: true });
  });
};


module.exports = {
  obtenerTemas,
  agregarTema,
  eliminarTema,
  agregarSubtema,
  eliminarSubtema
};
