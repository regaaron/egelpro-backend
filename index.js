const express = require('express');
const cors = require('cors');
require('dotenv').config();

const config = require('./config');
require('./db'); // Inicializa conexión a la BD

// Rutas
const temasRoutes = require('./routes/temas');
const authRoutes = require('./routes/auth');
const examenesRoutes = require('./routes/examenes');
const adminPreguntasAIRoutes = require('./routes/admin-preguntasai');
const adminPreguntasRouter = require('./routes/admin-preguntas');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Endpoints
app.use('/api/temas', temasRoutes);
app.use('/auth', authRoutes);
app.use('/examenes', examenesRoutes);
app.use('/admin', adminPreguntasAIRoutes);
app.use('/admin', adminPreguntasRouter);

// Ruta de prueba
app.get('/', (req, res) => {
  res.send("🚀 Backend EGEL PRO funcionando correctamente.");
});

// Iniciar servidor
app.listen(config.port, () => {
  console.log(`🚀 Servidor escuchando en el puerto ${config.port}`);
});
