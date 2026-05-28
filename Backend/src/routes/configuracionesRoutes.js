const express = require("express");
const multer = require("multer");
const path = require("path");
const { getConfiguracion, updateConfiguracion, uploadPhoto } = require("../controllers/configuracionesController");
const { verifyToken } = require("../middlewares/authMiddleware");

// Configurar multer para guardar fotos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "../../public/uploads/"));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, "profile-" + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Tipo de archivo no permitido"));
    }
  }
});

const router = express.Router();

router.get("/", verifyToken, getConfiguracion);
router.put("/", verifyToken, updateConfiguracion);
router.post("/photo", verifyToken, upload.single("photo"), uploadPhoto);

module.exports = router;
