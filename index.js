const express = require('express');
const cors = require('cors');
const connection = require('./db');
const temasRoutes = require('./routes/temas');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());
app.use('/api/temas',temasRoutes);


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor escuchando en el puerto ${PORT}`);
    
});