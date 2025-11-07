const admin = require("firebase-admin");
const serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const uid = "4yfQDS6wWOVEdGNiM3epr2o7bUk1";

async function setAdminRole() {
  try {
    await admin.auth().setCustomUserClaims(uid, { admin: true });
    console.log("✅ Custom claim 'admin' asignado al usuario", uid);
  } catch (err) {
    console.error("❌ Error al asignar claim:", err);
  }
}

setAdminRole();
