const express = require('express');
const routes = express.Router();
const { obtenerTemas } = require('../controllers/temasControllers');

routes.get('/', obtenerTemas);

module.exports = routes;