BACKEND:
npm install express cors nodemon axios pdfkit

FRONTEND:
npm install -D tailwindcss @tailwindcss/postcss postcss autoprefixer axios recharts

ALTERNATIVAS EN CASO DE ERROR:
Si tailwind llega a fallar lo mejor es crear el archivo "postcss.config.js" en la carpeta raiz del frontend agregandole el siguiente contenido:

export default {
  plugins: {
    '@tailwindcss/postcss': {},
    'autoprefixer': {},
  },
}

