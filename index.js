const express = require('express');
const cors = require('cors');
const connection = require('./db');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/ping',(req,res) =>{
    connection.query('SELECT 1 + 1 AS resultado',(err,resultado)=>{
        if(err) return res.status(500).json({ error: 'Error al ejecutar la consulta' });
        res.json({ resultado: resultado[0].resultado });
    });
});

app.get('/api/tablas', (req, res) => {
  connection.query('Describe usuarios', (err, results) => {
    if (err) {
      console.error('Error al obtener las tablas:', err);
      return res.status(500).send('Error al obtener las tablas');
    }

    // Extraer solo los nombres
    const tablas = results.map(row => Object.values(row)[0]);
    res.json(tablas);
  });
});


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor escuchando en el puerto ${PORT}`);
    
});