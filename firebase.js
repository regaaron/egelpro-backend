const admin = require("firebase-admin");

// 1. Construir el objeto de configuración de la cuenta de servicio 
//    usando las variables de entorno.
const serviceAccountConfig = {
    type: process.env.FIREBASE_TYPE,
    project_id: process.env.FIREBASE_PROJECT_ID,
    private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
    // La clave privada a veces necesita que los \n se restauren si la plataforma
    // los almacena literalmente como la cadena '\n'. Usamos replace(/\\n/g, '\n')
    // por si acaso, aunque no siempre es necesario.
    private_key: process.env.FIREBASE_PRIVATE_KEY ? 
                 process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n') : 
                 undefined,
    client_email: process.env.FIREBASE_CLIENT_EMAIL,
    client_id: process.env.FIREBASE_CLIENT_ID,
    auth_uri: process.env.FIREBASE_AUTH_URI,
    token_uri: process.env.FIREBASE_TOKEN_URI,
    auth_provider_x509_cert_url: process.env.FIREBASE_AUTH_PROVIDER_X509_CERT_URL,
    client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL,
    universe_domain: process.env.FIREBASE_UNIVERSE_DOMAIN,
};

// 2. Verificar si tenemos la información mínima necesaria
if (!serviceAccountConfig.project_id || !serviceAccountConfig.private_key) {
    console.error("ERROR: Faltan variables de entorno de Firebase. No se puede inicializar el SDK.");
    // Dependiendo de tu lógica, puedes optar por lanzar un error o salir.
    // throw new Error("Firebase admin initialization failed due to missing environment variables.");
}

// 3. Inicializar Firebase
admin.initializeApp({
    credential: admin.credential.cert(serviceAccountConfig),
});

module.exports = admin;