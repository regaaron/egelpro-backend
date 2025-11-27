const admin = require("firebase-admin");

// 1. Construir el objeto de configuración de la cuenta de servicio 
//    usando las variables de entorno (process.env)
const serviceAccountConfig = {
    // Estas propiedades deberían venir de tu archivo original serviceAccountKey.json
    type: process.env.FIREBASE_TYPE,
    project_id: process.env.FIREBASE_PROJECT_ID,
    private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
    
    // ** La clave del éxito para el despliegue **
    // 1. Reemplazamos la secuencia de escape literal "\\n" por un salto de línea real "\n".
    // 2. Usamos .trim() para eliminar cualquier espacio o caracter invisible al inicio o final.
    private_key: process.env.FIREBASE_PRIVATE_KEY ? 
                 process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n').trim() : 
                 undefined,
    
    // El resto de las propiedades de la cuenta de servicio
    client_email: process.env.FIREBASE_CLIENT_EMAIL,
    client_id: process.env.FIREBASE_CLIENT_ID,
    auth_uri: process.env.FIREBASE_AUTH_URI,
    token_uri: process.env.FIREBASE_TOKEN_URI,
    auth_provider_x509_cert_url: process.env.FIREBASE_AUTH_PROVIDER_X509_CERT_URL,
    client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL,
    universe_domain: process.env.FIREBASE_UNIVERSE_DOMAIN,
};


// ** AGREGAR ESTO PARA DEBUGGING **
console.log('--- Debugging Private Key ---');
console.log(serviceAccountConfig.private_key); // Esto imprimirá la clave con saltos de línea reales
console.log('-----------------------------');
// 2. Bloqueo de seguridad: asegurar que las variables mínimas estén presentes
if (!serviceAccountConfig.project_id || !serviceAccountConfig.private_key) {
    console.error("⛔ ERROR CRÍTICO: Faltan variables de entorno de Firebase. No se puede inicializar el SDK.");
    // Es buena práctica lanzar un error aquí para evitar que el servidor inicie mal configurado.
    throw new Error("Firebase admin initialization failed due to missing environment variables.");
}

// 3. Inicializar Firebase
admin.initializeApp({
    credential: admin.credential.cert(serviceAccountConfig),
});

module.exports = admin;