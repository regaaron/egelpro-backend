const express = require('express');
const cors = require('cors');
const connection = require('./db');
const temasRoutes = require('./routes/temas');
const authRoutes = require('./routes/auth');
const examenesRoutes = require('./routes/examenes');
const adminPreguntasAIRoutes = require('./routes/admin-preguntasai');
const adminPreguntasRouter = require('./routes/admin-preguntas');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());
app.use('/api/temas',temasRoutes);
app.use('/auth',authRoutes);
app.use('/examenes',examenesRoutes);
app.use('/admin',adminPreguntasAIRoutes);
app.use('/admin',adminPreguntasRouter);


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor escuchando en el puerto ${PORT}`);
    
});