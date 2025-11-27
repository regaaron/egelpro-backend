const admin = require("firebase-admin");
const config = require("./config");

admin.initializeApp({
  credential: admin.credential.cert({
    project_id: config.firebase.projectId,
    client_email: config.firebase.clientEmail,
    private_key: config.firebase.privateKey.replace(/\\n/g, "\n"),
  }),
});

module.exports = admin;
