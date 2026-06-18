const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: process.env.SMTP_PORT || 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

exports.generateVerificationCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

exports.sendVerificationEmail = async (email, code) => {
  await transporter.sendMail({
    from: `"AhorraApp" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "🔐 Verifica tu correo electrónico",
    html: `
      <div style="font-family: sans-serif; padding: 20px;">
        <h2 style="color: #f59e0b;">¡Bienvenido a AhorraApp!</h2>
        <p>Tu código de verificación es:</p>
        <div style="background: #1e4b8f; color: #fff; padding: 15px; font-size: 24px; font-weight: bold; letter-spacing: 4px; text-align: center; border-radius: 8px; margin: 10px 0;">
          ${code}
        </div>
        <p>Expira en 10 minutos. Si no te registraste, ignora este correo.</p>
      </div>
    `,
  });
};