const express = require('express');
const routes = express.Router();
const {
  obtenerTemas,
  agregarTema,
  eliminarTema,
  agregarSubtema,
  eliminarSubtema
} = require('../controllers/temasControllers');

routes.get('/', obtenerTemas);
routes.post('/', agregarTema);
routes.delete('/:id', eliminarTema);
routes.post('/:id_tema/subtemas', agregarSubtema);
routes.delete('/:id_tema/subtemas/:id_subtema', eliminarSubtema);

module.exports = routes;