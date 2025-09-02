const {getTemasConSubtemas } = require('../models/temasModel');

const obtenerTemas = async (req,res) =>{
    try{
        const rows = await getTemasConSubtemas();

        const temasMap = {};

        rows.forEach(row =>{
            if(!temasMap[row.id_tema]){
                temasMap[row.id_tema]={
                    id: row.id_tema,
                    nombre: row.tema,
                    descripcion: row.descripcion,
                    icono: row.icono,
                    subtemas: []
                };
            }
            if(row.id_subtema){
                temasMap[row.id_tema].subtemas.push({
                    id: row.id_subtema,
                    nombre: row.id_subtema
                });
            }
        });
        res.json(Object.values(temasMap));
    } catch (err){
        console.error('Error fetching temas:', err);
        res.status(500).json({ error: 'Error fetching temas' });
    }
};

module.exports = { obtenerTemas };