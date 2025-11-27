const admin = require("firebase-admin");
const config = require("./config");

if (!config.firebase.privateKey) {
  console.error("❌ ERROR: FIREBASE_PRIVATE_KEY no fue cargada.");
  process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.cert({
    project_id: config.firebase.projectId,
    client_email: config.firebase.clientEmail,
    private_key: config.firebase.privateKey,
  }),
});

module.exports = admin;
