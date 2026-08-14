const nodemailer = require("nodemailer");
require("dotenv").config();

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendResetCodeEmail = async (to, code) => {
  await transporter.sendMail({
    from: `"Ahorrapp" <${process.env.EMAIL_USER}>`,
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