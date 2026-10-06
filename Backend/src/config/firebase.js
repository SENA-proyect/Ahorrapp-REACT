const admin = require("firebase-admin");

const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT
  ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
  : require("./ahorrapp-5b863-firebase-adminsdk-fbsvc-1ce24efa5c.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

module.exports = admin;