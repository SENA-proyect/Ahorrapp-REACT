# Ahorrapp 💰

Aplicación web de gestión financiera personal desarrollada con React + Express + MySQL.

## Estructura del Proyecto

```
Ahorrapp-REACT/
├── Backend/          # API REST con Express.js
├── Frontend/         # SPA con React + Vite
├── SQL/              # Scripts de base de datos
└── docs/             # Documentación del proyecto
```

## Requisitos

- Node.js 18+
- MySQL 8+ (o XAMPP)
- npm

## Instalación

### Backend
```bash
cd Backend
npm install
npm run dev
```

### Frontend
```bash
cd Frontend
npm install
npm run dev
```

### Base de Datos
1. Crear la base de datos en MySQL
2. Ejecutar el script `SQL/schema.sql`
3. Configurar las variables de entorno en `Backend/.env`

## Variables de Entorno (Backend/.env)
```
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=tu_password
DB_NAME=nombre_db
JWT_SECRET=tu_secret
```

## Tecnologías

- **Frontend:** React 18, Vite, Framer Motion, Recharts
- **Backend:** Express.js, MySQL2, JWT, Multer, Nodemailer
- **Base de datos:** MySQL
