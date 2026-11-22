const nodemailer = require("nodemailer");
require("dotenv").config();

const emailUser = process.env.EMAIL_USER;
const emailPass = process.env.EMAIL_PASS;

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: emailUser,
    pass: emailPass,
  },
});

const sendResetCodeEmail = async (to, code) => {
  if (!emailUser || !emailPass) {
    throw new Error("EMAIL_USER y EMAIL_PASS no están configuradas");
  }

  await transporter.sendMail({
    from: `"Ahorrapp" <${emailUser}>`,
    to,
    subject: "Código para recuperar tu contraseña",
    html: `
      <p>Tu código de verificación es:</p>
      <h2>${code}</h2>
      <p>Este código expira en 15 minutos. Si no solicitaste esto, ignora este correo.</p>
    `,
  });
};

module.exports = { sendResetCodeEmail };