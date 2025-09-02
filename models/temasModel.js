const pool = require('../db');

const getTemasConSubtemas = async ()=>{
    const [rows] = await pool.query(`
            SELECT t.id_tema, t.nombre AS tema, t.descripcion,t.icono, s.id_subtema,s.nombre AS id_subtema
            FROM temas t
            LEFT JOIN subtemas s ON s.id_tema = t.id_tema
            ORDER BY t.id_tema, s.id_subtema
        `);
        console.log(rows);
    return rows;
};

module.exports = { getTemasConSubtemas };