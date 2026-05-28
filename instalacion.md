BACKEND:
npm install express cors nodemon axios pdfkit multer

FRONTEND:

npm install framer-motion recharts

npm install -D tailwindcss @tailwindcss/postcss postcss autoprefixer axios

ALTERNATIVAS EN CASO DE ERROR:
Si tailwind llega a fallar lo mejor es crear el archivo "postcss.config.js" en la carpeta raiz del frontend agregandole el siguiente contenido:

export default {
  plugins: {
    '@tailwindcss/postcss': {},
    'autoprefixer': {},
  },
}

correo*

npm install nodemailer mysql2 bcrypt jsonwebtoken dotenv crypto

IMPORTANTE : agregar este codigo en mysql para que funcione 

ALTER TABLE USUARIOS 
ADD COLUMN verification_code VARCHAR(6),
ADD COLUMN code_expires_at DATETIME,
ADD COLUMN email_verified TINYINT(1) DEFAULT 0;